import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportRepository } from '@modules/reports/repository/repositories/report.repository';
import { ReportCreateRequestDto } from '@modules/reports/dtos/request/report.create.request.dto';
import { ReportDocument, ReportEntity } from '@modules/reports/repository/entities/report.entity';
import { ENUM_REPORT_LOCATION_TYPE, ENUM_REPORT_SEVERITY, ENUM_REPORT_SOURCE, ENUM_REPORT_STATUS, ENUM_USER_ROLE } from '@repo/shared';
import { IDatabaseCreateOptions, IDatabaseDeleteManyOptions, IDatabaseDeleteOptions, IDatabaseFindAllOptions, IDatabaseFindOneOptions, IDatabaseGetTotalOptions, IDatabaseUpdateOptions } from '@common/database/interfaces/database.interface';
import { IReportDocument, IReportEntity } from '../interfaces/report.interface';
import { ReportListResponseDto } from '../dtos/response/report.list.reponse.dto';
import { Document } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { HelperGeoService } from '@common/helper/services/helper.geo.service';
import { ReportUpdateRequestDto } from '../dtos/request/report.update.request.dto';
import { ReportDetailResponseDto } from '../dtos/response/report.detail.response.dto';
import { S3Service } from '@common/s3/s3.service';
import { CreateGuestReportDto } from '../dtos/request/report.create-guest.request.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly helperdateService: HelperDateService,
    private readonly helperGeoService: HelperGeoService,
    private readonly s3Service: S3Service,
  ) { }

  private buildLogicFilter(
    user: UserDocument,
    regionId: string,
  ): Record<string, any> {

    if (
      user.role === ENUM_USER_ROLE.ADMIN ||
      user.role === ENUM_USER_ROLE.SUPER_ADMIN
    ) {
      return {};
    }

    const userId = user._id;
    const isVolunteer = user.role === ENUM_USER_ROLE.VOLUNTEER;

    // 🅰️ USER MODE: Chỉ xem tin của mình
    if (!isVolunteer) {
      return { user: userId };
    }

    const volunteerConditions: Record<string, any>[] = [
      // A. Tin do chính mình tạo ra (Dù là volunteer vẫn có thể là nạn nhân)
      { user: userId },

      // B. Nhiệm vụ mình đang thực hiện hoặc đã làm xong
      {
        rescuer: userId,
        status: {
          $in: [ENUM_REPORT_STATUS.IN_PROGRESS, ENUM_REPORT_STATUS.RESOLVED],
        },
      },
    ];

    if (regionId) {
      volunteerConditions.push({
        regionId: regionId,
        status: { $in: [ENUM_REPORT_STATUS.PENDING, ENUM_REPORT_STATUS.VERIFIED] },
        rescuer: null,
      });
    }

    return { $or: volunteerConditions };
  }

  private extractTextSearch(find: Record<string, any>) {
    const { q, ...restFind } = find;

    let textQuery = {};

    if (q) {
      const regex = new RegExp(q, 'i');
      textQuery = {
        $or: [
          { address: { $regex: regex } },
          { notes: { $regex: regex } },
        ],
      };
    }

    return { restFind, textQuery };
  }

  private buildAppLogicFilter(
    user: UserDocument,
    regionId?: string,
  ): Record<string, any> {
    if (
      user.role === ENUM_USER_ROLE.ADMIN ||
      user.role === ENUM_USER_ROLE.SUPER_ADMIN
    ) {
      // Nếu Admin dùng App -> Có thể xem hết hoặc xử lý theo mode (như bài trước ta bàn)
      // Ở đây giữ logic cũ của bạn: Admin thấy hết -> return rỗng
      return {};
    }

    const userId = user._id;
    const isVolunteer = user.role === ENUM_USER_ROLE.VOLUNTEER;

    // A. USER THƯỜNG: Chỉ xem tin của mình
    if (!isVolunteer) {
      return { user: userId };
    }

    // B. VOLUNTEER
    const volunteerConditions: Record<string, any>[] = [
      { user: userId }, // Tin mình tạo
      {
        rescuer: userId, // Tin mình đang cứu
        status: { $in: [ENUM_REPORT_STATUS.IN_PROGRESS, ENUM_REPORT_STATUS.RESOLVED] },
      },
    ];

    // C. Tin SOS xung quanh (Chưa ai nhận)
    if (regionId) {
      volunteerConditions.push({
        regionId: regionId,
        status: { $in: [ENUM_REPORT_STATUS.PENDING, ENUM_REPORT_STATUS.VERIFIED] },
        rescuer: null,
      });
    }

    return { $or: volunteerConditions };
  }

  private buildAppQuery(find: Record<string, any>, user: UserDocument): Record<string, any> {
    // 1. Tách 'q' xử lý riêng
    const { restFind, textQuery } = this.extractTextSearch(find);

    // 2. Lấy Logic User/Volunteer (Cần regionId từ find để lọc tin xung quanh)
    const logicFilter = this.buildAppLogicFilter(user, restFind.regionId);

    // 3. Merge tất cả
    return {
      $and: [restFind, textQuery, logicFilter].filter(f => Object.keys(f).length > 0)
    };
  }

  private buildAdminQuery(find: Record<string, any>): Record<string, any> {
    const { restFind, textQuery } = this.extractTextSearch(find);

    return {
      $and: [restFind, textQuery].filter(f => Object.keys(f).length > 0)
    };
  }

  async createByUser(
    userId: string,
    creatorId: string,
    dto: ReportCreateRequestDto,
    options?: IDatabaseCreateOptions
  ): Promise<ReportEntity> {
    const create: ReportEntity = new ReportEntity();
    create.user = userId;
    create.by = userId;
    create.type = dto.type;
    create.notes = dto.notes;
    create.severity = dto.severity;
    create.peopleCount = dto.peopleCount;
    create.isPublic = dto.isPublic;
    create.status = ENUM_REPORT_STATUS.PENDING;
    create.regionId = dto.regionId;

    create.location = {
      type: ENUM_REPORT_LOCATION_TYPE.POINT,
      coordinates: dto.coordinates,
    };

    const report = await this.reportRepository.create<ReportEntity>(create, options);

    this.eventEmitter.emit('report.created', {
      reportId: report._id.toString(),
      regionId: dto.regionId, // Quan trọng: Để Gateway biết bắn vào room nào
      data: report
    });

    return report;
  }

  async createByAdmin(
    userId: string,
    creatorId: string,
    dto: ReportCreateRequestDto,
    options?: IDatabaseCreateOptions
  ): Promise<ReportEntity> {
    const create: ReportEntity = new ReportEntity();
    create.user = userId;
    create.by = creatorId;
    create.notes = dto.notes;
    create.severity = dto.severity;
    create.peopleCount = dto.peopleCount;
    create.isPublic = dto.isPublic;
    create.status = ENUM_REPORT_STATUS.PENDING;

    create.location = {
      type: ENUM_REPORT_LOCATION_TYPE.POINT,
      coordinates: dto.coordinates,
    };

    return this.reportRepository.create<ReportEntity>(create, options);
  }

  async createGuest(
    dto: CreateGuestReportDto,
    options?: IDatabaseCreateOptions
  ): Promise<ReportEntity> {
    const create: ReportEntity = new ReportEntity();

    create.type = dto.type;
    create.notes = dto.notes;
    create.severity = dto.severity || ENUM_REPORT_SEVERITY.HIGH; // Guest SOS implies urgency
    create.peopleCount = 1;
    create.isPublic = true;
    create.status = ENUM_REPORT_STATUS.PENDING;
    create.regionId = dto.regionId;
    create.source = ENUM_REPORT_SOURCE.GUEST;
    create.isVerified = false;
    create.deviceId = dto.deviceId;

    create.location = {
      type: ENUM_REPORT_LOCATION_TYPE.POINT,
      coordinates: dto.coordinates,
    };

    if (dto.phone) {
      create.notes = (create.notes ? create.notes + '\n' : '') + `Guest Phone: ${dto.phone}`;
    }

    const report = await this.reportRepository.create<ReportEntity>(create, options);

    this.eventEmitter.emit('report.created', {
      reportId: report._id.toString(),
      regionId: dto.regionId,
      data: report
    });

    return report;
  }

  async checkGuestRateLimit(deviceId: string): Promise<boolean> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const count = await this.reportRepository.getTotal({
      deviceId: deviceId,
      source: ENUM_REPORT_SOURCE.GUEST,
      createdAt: { $gte: oneHourAgo },
      status: {
        $in: [
          ENUM_REPORT_STATUS.PENDING,
          ENUM_REPORT_STATUS.VERIFIED,
          ENUM_REPORT_STATUS.IN_PROGRESS
        ]
      }
    });

    return count < 3;
  }

  async findAllApp(
    find: Record<string, any>,
    options?: IDatabaseFindAllOptions,
    user?: UserDocument,
  ): Promise<IReportDocument[]> {
    const query = this.buildAppQuery(find, user!);
    return this.reportRepository.findAll<IReportDocument>(query, {
      ...options,
      join: true,
    });
  }

  async findAll(
    find?: Record<string, any>,
    options?: IDatabaseFindAllOptions,
    user?: UserDocument,
  ): Promise<IReportDocument[]> {
    const query = this.buildAppQuery(find, user!);
    return this.reportRepository.findAll<IReportDocument>(query, {
      ...options,
      join: true,
    });
  }

  async findAllByAdmin(
    find: Record<string, any>,
    options?: IDatabaseFindAllOptions,
  ): Promise<IReportDocument[]> {
    const query = this.buildAdminQuery(find);
    return this.reportRepository.findAll<IReportDocument>(query, {
      ...options,
      join: true,
    });
  }

  // 2. Find All By User
  async findAllByUser(
    userId: string,
    find?: Record<string, any>,
    options?: IDatabaseFindAllOptions
  ): Promise<IReportDocument[]> {
    return this.reportRepository.findAll<IReportDocument>(
      { ...find, user: userId },
      { ...options, join: true }
    );
  }

  async findAllByCreator(
    userId: string,
    find?: Record<string, any>,
    options?: IDatabaseFindAllOptions
  ): Promise<IReportDocument[]> {
    return this.reportRepository.findAll<IReportDocument>(
      { ...find, by: userId },
      { ...options, join: true }
    );
  }

  // 3. Find One By ID
  async findOneById(
    _id: string,
    options?: IDatabaseFindOneOptions
  ): Promise<ReportDocument> {
    return this.reportRepository.findOneById<ReportDocument>(_id, options);
  }

  async findOneByIdJoined(
    _id: string,
    options?: IDatabaseFindOneOptions
  ): Promise<IReportDocument> {
    return this.reportRepository.findOneById<IReportDocument>(_id, {
      ...options,
      join: true,
    });
  }

  // 4. Find One (General)
  async findOne(
    find: Record<string, any>,
    options?: IDatabaseFindOneOptions
  ): Promise<ReportDocument> {
    return this.reportRepository.findOne<ReportDocument>(find, options);
  }

  async getTotalByUser(
    userId: string,
    find?: Record<string, any>,
    options?: IDatabaseGetTotalOptions
  ): Promise<number> {
    return this.reportRepository.getTotal(
      { ...find, user: userId },
      options
    );
  }

  async getTotal(
    find: Record<string, any>,
  ): Promise<number> {
    const query = this.buildAdminQuery(find);
    return this.reportRepository.getTotal(query);
  }

  async getTotalApp(
    find: Record<string, any>,
    user?: UserDocument,
  ): Promise<number> {
    const query = this.buildAppQuery(find, user!);
    return this.reportRepository.getTotal(query);
  }

  async delete(_id: string, options?: IDatabaseDeleteOptions) {
    // Get report to retrieve image URLs before deletion
    const report = await this.reportRepository.findOneById(_id);

    if (report && report.images && report.images.length > 0) {
      // Delete all images from S3
      const deletePromises = report.images.map((imageUrl) =>
        this.s3Service.deleteFileByUrl(imageUrl).catch((error: any) => {
          console.warn(`Failed to delete image ${imageUrl}:`, error?.message);
        })
      );

      await Promise.all(deletePromises);
    }

    return this.reportRepository.delete({
      _id
    }, options);
  }

  // 7. Delete Many
  async deleteMany(
    find: Record<string, any>,
    options?: IDatabaseDeleteManyOptions
  ): Promise<boolean> {
    await this.reportRepository.deleteMany(find, options);

    return true;
  }

  async findInBounds(minLat: number, maxLat: number, minLng: number, maxLng: number, options?: IDatabaseFindAllOptions) {
    return this.reportRepository.findAll<IReportDocument>({
      location: {
        $geoWithin: {
          $box: [
            [minLng, minLat], // Tọa độ góc Tây Nam (Bottom-Left)
            [maxLng, maxLat], // Tọa độ góc Đông Bắc (Top-Right)
          ],
        },
      },
    }, options);
  }

  mapList(
    reports: IReportEntity[] | IReportDocument[]
  ): ReportListResponseDto[] {
    return plainToInstance(
      ReportListResponseDto,
      reports.map((r: IReportEntity | IReportDocument) =>
        r instanceof Document ? r.toObject() : r
      )
    );
  }

  mapDetail(
    report: IReportEntity | IReportDocument
  ): ReportDetailResponseDto {
    const plain = report instanceof Document ? report.toObject() : report;
    (plain as any).images = [];

    // Masking Logic
    if (plain.user && typeof plain.user === 'object' && 'mobileNumber' in plain.user) {
      // If reported by current user (this logic needs context, but mapDetail usually doesn't have it explicitly without passing user)
      // Ideally, we handle masking in controller or pass user to map function.
      // For now, let's implement basic masking and refine in controller if needed, 
      // OR better: assume this is public view and mask unless specific condition.

      // HOWEVER, to be safe and simple: Mask always in mapDetail, 
      // and Controller can OVERRIDE/UNMASK if it knows the viewer is authorized.
      // BUT, `plain` object is what we return.

      // Let's change the strategy: 
      // The Controller determines VISIBILITY. 
      // ReportService.mapDetail should probably just return data.
      // But the requirement says: "Default: Always hide or mask". "Show only if..."

      // So, default behavior: MASK.
      const u = plain.user as any;
      if (u.mobileNumber) {
        u.mobileNumber = u.mobileNumber.replace(/(\d{3})\d+(\d{3})/, '$1****$2');
      }
    }

    return plainToInstance(ReportDetailResponseDto, plain);
  }

  async acceptReport(
    reportId: string,
    rescuer: UserDocument,
    options?: IDatabaseUpdateOptions
  ) {
    // 1. Check if rescuer already has an active report
    const activeReport = await this.reportRepository.findOne({
      rescuer: rescuer._id.toString(),
      status: ENUM_REPORT_STATUS.IN_PROGRESS
    });

    if (activeReport) {
      throw new BadRequestException('report.error.alreadyHasActiveReport');
    }

    // 2. Check distance
    const report = await this.reportRepository.findOneById(reportId);
    if (!report) {
      throw new BadRequestException('report.error.notFound');
    }

    // If rescuer has location, check distance
    if (rescuer.location && rescuer.location.coordinates && report.location && report.location.coordinates) {
      const distance = this.helperGeoService.calculateDistance(
        rescuer.location.coordinates[1],
        rescuer.location.coordinates[0],
        report.location.coordinates[1],
        report.location.coordinates[0]
      );

      // MAX RADIUS: 10km (10000m) - Hardcoded for now, or fetch from config
      const MAX_RADIUS = 10000;

      if (distance > MAX_RADIUS) {
        throw new BadRequestException('report.error.tooFar');
      }
    }

    const updated = await this.reportRepository.updateRaw(
      {
        _id: reportId,
        status: ENUM_REPORT_STATUS.PENDING, // Chỉ nhận khi còn Pending
      },
      {
        status: ENUM_REPORT_STATUS.IN_PROGRESS,
        rescuer: rescuer._id.toString(),
        acceptedAt: new Date(),
      },
      options // Trả về data mới sau khi update
    );

    if (updated) {
      this.eventEmitter.emit('report.accepted', {
        reportId: updated._id.toString(),
        rescuerId: rescuer._id.toString(),
        regionId: updated.regionId,
        report: updated // Pass full report for context if needed
      });
    }

    return updated;
  }

  async rejectReport(
    report: ReportDocument,
    options?: IDatabaseUpdateOptions
  ) {
    report.status = ENUM_REPORT_STATUS.PENDING;
    report.rescuer = null;
    return this.reportRepository.save(report, options);
  }

  async completeReport(report: ReportDocument, options?: IDatabaseUpdateOptions) {
    report.status = ENUM_REPORT_STATUS.RESOLVED;
    report.resolvedAt = new Date();
    const saved = await this.reportRepository.save(report, options);

    this.eventEmitter.emit('report.resolved', {
      reportId: saved._id.toString(),
      report: saved
    });

    return saved;
  }

  async cancelReport(report: ReportDocument, options?: IDatabaseUpdateOptions) {
    report.status = ENUM_REPORT_STATUS.PENDING;
    return this.reportRepository.save(report, options);
  }

  async updateByUser(
    user: UserDocument,
    reportId: string,
    dto: ReportUpdateRequestDto,
    options?: IDatabaseUpdateOptions
  ) {
    return this.reportRepository.updateRaw({
      _id: reportId,
      by: user._id.toString(),
    }, {
      ...dto
    }, options);
  }

  async checkLastReport(
    userId: string,
    lat: number,
    long: number
  ) {
    const lastReport = await this.reportRepository.findOne({
      user: userId,
      status: ENUM_REPORT_STATUS.PENDING,
    });

    if (lastReport) {
      const distance = this.helperGeoService.calculateDistance(
        lat,
        long,
        lastReport?.location.coordinates[1],
        lastReport?.location.coordinates[0]
      );

      if (distance < 100) {
        return true;
      }
    }

    return false;
  }

  async getGrowthStats(startDate: Date, endDate: Date, timezone = '+07:00') {
    return this.reportRepository.findAllAggregate<{ _id: string; count: number }>([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getDeletedStats(startDate: Date, endDate: Date, timezone = '+07:00') {
    return this.reportRepository.findAllAggregate<{ _id: string; count: number }>([
      {
        $match: {
          deletedAt: { $gte: startDate, $lte: endDate },
          deleted: true
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$deletedAt', timezone } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getStatistics() {
    const stats = await this.reportRepository.getStatistics();
    return stats[0] || { avgResponseTime: 0, avgRescueTime: 0, avgTotalTime: 0, count: 0 };
  }
}
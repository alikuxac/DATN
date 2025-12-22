import { Injectable } from '@nestjs/common';
import { ReportRepository } from '@modules/reports/repository/repositories/report.repository';
import { ReportCreateRequestDto } from '@modules/reports/dtos/request/report.create.request.dto';
import { ReportDocument, ReportEntity } from '@modules/reports/repository/entities/report.entity';
import { ENUM_REPORT_LOCATION_TYPE, ENUM_REPORT_STATUS } from '@repo/shared';
import { IDatabaseCreateOptions, IDatabaseDeleteManyOptions, IDatabaseDeleteOptions, IDatabaseFindAllOptions, IDatabaseFindOneOptions, IDatabaseGetTotalOptions, IDatabaseUpdateOptions } from '@common/database/interfaces/database.interface';
import { IReportDocument, IReportEntity } from '../interfaces/report.interface';
import { ReportListResponseDto } from '../dtos/response/report.list.reponse.dto';
import { Document } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { ReportListRequestDto } from '../dtos/request/report.list.request.dto';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { HelperGeoService } from '@common/helper/services/helper.geo.service';
import { ReportUpdateRequestDto } from '../dtos/request/report.update.request.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly helperdateService: HelperDateService,
    private readonly helperGeoService: HelperGeoService,
  ) { }

  private buildLogicFilter(
    user: UserDocument,
    regionId: string,
  ): Record<string, any> {
    const isVolunteer = user.isVolunteer;

    // 🅰️ USER MODE: Chỉ xem tin của mình
    if (!isVolunteer) {
      return { user: user._id.toString() };
    } else {

      return {
        $or: [
          // 1. Nhiệm vụ của tôi (Đang làm hoặc Đã xong)
          {
            rescuer: user._id,
            status: { $in: [ENUM_REPORT_STATUS.IN_PROGRESS, ENUM_REPORT_STATUS.RESOLVED] }
          },
          // 2. Tin SOS mới trong vùng (Chưa ai nhận)
          {
            regionId: regionId,
            status: ENUM_REPORT_STATUS.PENDING,
            rescuer: null
          }
        ]
      };
    }
  }

  private buildAdvancedFilter(dto: ReportListRequestDto) {
    const filter: Record<string, any> = {};

    // 1. Lọc theo Type (Loại cứu trợ)
    if (dto.type && dto.type !== ('all' as any)) {
      filter.type = dto.type;
    }

    // 2. Lọc theo Time Range (Thời gian)
    if (dto.timeRange && dto.timeRange > 0) {
      const timeAgo = this.helperdateService.create();
      timeAgo.setHours(timeAgo.getHours() - dto.timeRange); // Trừ đi số giờ

      filter.createdAt = { $gte: timeAgo }; // Lấy từ thời điểm đó trở đi
    }

    // 3. Xử lý Search Query (q) - Tìm trong address hoặc notes
    if (dto.q) {
      filter.$or = [
        { address: { $regex: new RegExp(dto.q, 'i') } },
        { notes: { $regex: new RegExp(dto.q, 'i') } },
      ];
    }

    return filter;
  }

  async createByUser(
    userId: string,
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

  // 1. Find All
  async findAll(
    find?: Record<string, any>,
    options?: IDatabaseFindAllOptions,
    user?: UserDocument,
    dto?: ReportListRequestDto,
  ): Promise<IReportDocument[]> {
    const logicFilter = user && dto ? this.buildLogicFilter(user, dto.regionId) : {};

    const advancedFilter = dto ? this.buildAdvancedFilter(dto) : {};

    const query = {
      $and: [
        find,
        logicFilter,
        advancedFilter,
      ].filter(f => Object.keys(f).length > 0) 
    };

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
      { ...find, user: userId }, // Filter theo field 'user'
      { ...options, join: true }
    );
  }

  async findAllByCreator(
    userId: string,
    find?: Record<string, any>,
    options?: IDatabaseFindAllOptions
  ): Promise<IReportDocument[]> {
    return this.reportRepository.findAll<IReportDocument>(
      { ...find, by: userId }, // Filter theo field 'user'
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

  // 4. Find One (General)
  async findOne(
    find: Record<string, any>,
    options?: IDatabaseFindOneOptions
  ): Promise<ReportDocument> {
    return this.reportRepository.findOne<ReportDocument>(find, options);
  }

  // 5. Get Totals
  async getTotal(
    find?: Record<string, any>,
    options?: IDatabaseGetTotalOptions,
    user?: UserDocument,
    dto?: ReportListRequestDto
  ): Promise<number> {
    const logicFilter = user && dto ? this.buildLogicFilter(user, dto.regionId) : {};
    const query = { $and: [find, logicFilter] };
    return this.reportRepository.getTotal(query, options);
  }

  // 6. Get Totals By User
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

  async delete(_id: string, options?: IDatabaseDeleteOptions) {
    return this.reportRepository.delete({
      _id
    }, options)
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
    )
  }

  async acceptReport(
    reportId: string,
    rescuerId: string,
    options?: IDatabaseUpdateOptions
  ) {

    return this.reportRepository.updateRaw(
      {
        _id: reportId,
        status: ENUM_REPORT_STATUS.PENDING, // Chỉ nhận khi còn Pending
      },
      {
        status: ENUM_REPORT_STATUS.IN_PROGRESS,
        rescuer: rescuerId,
      },
      options // Trả về data mới sau khi update
    );
  }

  async rejectReport(
    report: ReportDocument,
    options?: IDatabaseUpdateOptions
  ) {
    report.status = ENUM_REPORT_STATUS.PENDING;
    report.rescuer = null;
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
    userId:string,
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
}
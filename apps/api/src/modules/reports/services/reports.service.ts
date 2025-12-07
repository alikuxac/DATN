import { Injectable } from '@nestjs/common';
import { ReportRepository } from '@modules/reports/repository/repositories/report.repository';
import { ReportCreateRequestDto } from '@modules/reports/dtos/request/report.create.request.dto';
import { ReportDocument, ReportEntity } from '@modules/reports/repository/entities/report.entity';
import { ENUM_REPORT_LOCATION_TYPE, ENUM_REPORT_STATUS } from '@modules/reports/enums/report.enum';
import { IDatabaseCreateOptions, IDatabaseDeleteManyOptions, IDatabaseFindAllOptions, IDatabaseFindOneOptions, IDatabaseGetTotalOptions } from '@common/database/interfaces/database.interface';
import { IReportDocument, IReportEntity } from '../interfaces/report.interface';
import { ReportListResponseDto } from '../dtos/response/report.list.reponse.dto';
import { Document } from 'mongoose';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) { }

  async createByUser(
    userId: string,
    dto: ReportCreateRequestDto,
    options?: IDatabaseCreateOptions
  ): Promise<ReportEntity> {
    const create: ReportEntity = new ReportEntity();
    create.user = userId;
    create.by = userId;
    create.address = dto.address;
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

  async createByAdmin(
    userId: string,
    creatorId: string,
    dto: ReportCreateRequestDto,
    options?: IDatabaseCreateOptions
  ): Promise<ReportEntity> {
    const create: ReportEntity = new ReportEntity();
    create.user = userId;
    create.by = creatorId;
    create.address = dto.address;
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
    options?: IDatabaseFindAllOptions
  ): Promise<IReportDocument[]> {
    return this.reportRepository.findAll<IReportDocument>(find, {
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
    options?: IDatabaseGetTotalOptions
  ): Promise<number> {
    return this.reportRepository.getTotal(find, options);
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

  // 7. Delete Many
  async deleteMany(
    find: Record<string, any>,
    options?: IDatabaseDeleteManyOptions
  ): Promise<boolean> {
    await this.reportRepository.deleteMany(find, options);

    return true;
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
}
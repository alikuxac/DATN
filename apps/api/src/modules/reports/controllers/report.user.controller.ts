import { BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportService } from '../services/reports.service';
import { ReportCreateRequestDto } from '../dtos/request/report.create.request.dto';
import { AuthJwtAccessProtected, AuthJwtPayload } from '@modules/auth/decorators/auth.jwt.decorator'; // Hoặc decorator tương ứng của bạn
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { Response, ResponsePaging } from '@common/response/decorators/response.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { IReportDocument } from '../interfaces/report.interface';
import { ReportUpdateRequestDto } from '../dtos/request/report.update.request.dto';
import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS, ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS, ENUM_REPORT_TYPE, ENUM_STATUS_CODE_ERROR, ENUM_USER_ROLE, ENUM_REPORT_SOURCE } from '@repo/shared';
import { DatabaseService } from '@common/database/services/database.service';
import { ClientSession } from 'mongoose';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationQuery, PaginationQueryFilterDate, PaginationQueryFilterDateTimeRange, PaginationQueryFilterInEnum } from '@common/pagination/decorators/pagination.decorator';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { PolicyAbilityProtected } from '@modules/policy/decorators/policy.decorator';
import { ENUM_POLICY_SUBJECT, ENUM_POLICY_ACTION } from '@repo/shared';
import { UserProtected } from '@modules/users/decorators/user.decorator';

@Controller({
  version: '1',
  path: '/report',
})
export class ReportUserController {
  constructor(
    private readonly reportService: ReportService,
    private readonly databaseService: DatabaseService,
    private readonly paginationService: PaginationService
  ) { }

  @ResponsePaging('report.list')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @Get('/')
  async list(
    @PaginationQuery({
      defaultPerPage: 20,
      availableSearch: ['q', 'address', 'notes', 'regionId'], // User app cũng có 'q'
      availableOrderBy: ['createdAt', 'peopleCount'],
    })
    { _search, _limit, _offset, _order }: PaginationListDto,
    @PaginationQueryFilterInEnum('severity', ENUM_REPORT_SEVERITY.MEDIUM, ENUM_REPORT_SEVERITY)
    severity: ENUM_REPORT_SEVERITY[],
    @PaginationQueryFilterInEnum('status', ENUM_REPORT_STATUS.IN_PROGRESS, ENUM_REPORT_STATUS)
    status: ENUM_REPORT_STATUS[],
    @PaginationQueryFilterInEnum('type', ENUM_REPORT_TYPE.EVACUATION, ENUM_REPORT_TYPE)
    type: ENUM_REPORT_TYPE[],
    @PaginationQueryFilterInEnum('source', ENUM_REPORT_SOURCE.APP, ENUM_REPORT_SOURCE)
    source: ENUM_REPORT_SOURCE[],
    @Query('dateField') rawDateField: string,
    @PaginationQueryFilterDateTimeRange('timeRange') timeRange: Date,
    @PaginationQueryFilterDate('fromDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.GREATER_THAN_EQUAL) fromDate: Date,
    @PaginationQueryFilterDate('toDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.LESS_THAN_EQUAL) toDate: Date,
    @PaginationQueryFilterDate('exactDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.EQUAL) exactDate: Date,
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
  ) {
    const find: Record<string, any> = { ..._search };

    if (severity?.length) find.severity = { $in: severity };
    if (status?.length) find.status = { $in: status };
    if (type?.length) find.type = { $in: type };
    if (source?.length) find.source = { $in: source };

    const dateQuery = this.paginationService.buildDateQuery(
      { dateField: rawDateField, timeRange, fromDate, toDate, exactDate },
      ['createdAt', 'updatedAt'] // Whitelist fields
    );
    Object.assign(find, dateQuery);

    const reports = await this.reportService.findAllApp(
      find,
      {
        paging: { limit: _limit, offset: _offset },
        order: _order,
      },
      user // 👈 App cần user context
    );

    const total = await this.reportService.getTotalApp(find, user);
    const totalPage = this.paginationService.totalPage(total, _limit);

    return {
      _pagination: { total, totalPage },
      data: this.reportService.mapList(reports),
    };
  }

  @Response('report.create')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.CREATE],
  })
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('/')
  async create(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Body() body: ReportCreateRequestDto
  ) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      if (user.role !== ENUM_USER_ROLE.USER) {
        return this.reportService.createByUser(user._id.toString(), user._id.toString(), body);
      }

      const checkLastReport = await this.reportService.checkLastReport(user._id.toString(), body.coordinates[1], body.coordinates[0]);

      if (checkLastReport) {
        throw new BadRequestException('report.error.tooClose');
      }

      await this.reportService.createByUser(user._id.toString(), user._id.toString(), body, { session });

      await this.databaseService.commitTransaction(session);
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }

  }

  @Response('report.update')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':id')
  async update(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Param('id') id: string,
    @Body() body: ReportUpdateRequestDto
  ) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.findOneById(id);
      if (!report) {
        throw new BadRequestException('report.error.notFound');
      }

      if (user.role !== ENUM_USER_ROLE.USER) {
        const result = await this.reportService.updateByUser(user, report._id.toString(), body, { session });
        await this.databaseService.commitTransaction(session);
        return result;
      }

      if (report.by.toString() !== user._id.toString()) {
        throw new BadRequestException('report.error.cannotUpOther');
      }

      if (report.status !== ENUM_REPORT_STATUS.PENDING) {
        throw new BadRequestException('report.error.alreadyProcessed')
      }

      const result = await this.reportService.updateByUser(user, report._id.toString(), body, { session });
      await this.databaseService.commitTransaction(session);
      return result;
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }
  }

  @Response('report.detail')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @Get(':id')
  async get(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    const report = await this.reportService.findOneByIdJoined(id);
    if (!report) {
      throw new BadRequestException('report.error.notFound');
    }

    return {
      data: this.reportService.mapDetail(report),
    };
  }

  @Response('report.delete')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.DELETE],
  })
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @Delete(':id')
  async delete(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    if (user.role !== ENUM_USER_ROLE.USER) {
      return this.reportService.delete(id);
    }

    const report = await this.reportService.findOneById(id);
    if (!report) {
      throw new BadRequestException('report.error.notFound');
    }

    if (report.by.toString() !== user._id.toString()) {
      throw new BadRequestException('report.error.cannotDelOther');
    }

    return this.reportService.delete(id);
  }

  @Response('report.accept')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @AuthJwtAccessProtected()
  @Post(':id/accept')
  async accept(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    // Check ownership to prevent self-accept (except for Admin/SuperAdmin)
    const existingReport = await this.reportService.findOneById(id);
    if (!existingReport) {
      throw new BadRequestException('report.error.notFound');
    }

    // Only check ownership for non-admin users
    if (user.role !== ENUM_USER_ROLE.ADMIN && user.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
      if (
        (existingReport.by && existingReport.by.toString() === user._id.toString()) ||
        (existingReport.user && existingReport.user.toString() === user._id.toString())
      ) {
        throw new BadRequestException('report.error.cannotAcceptOwn');
      }
    }

    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.acceptReport(id, user, { session });

      if (!report) {
        throw new BadRequestException('report.error.alreadyAccepted');
      }

      await this.databaseService.commitTransaction(session);
      return { data: report };
    } catch (err: unknown) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }

  }

  @Response('report.reject')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @AuthJwtAccessProtected()
  @Post(':id/reject')
  async reject(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.findOneById(id);
      if (!report) {
        throw new BadRequestException('report.error.notFound');
      }

      // Check ownership to prevent self-reject (except for Admin/SuperAdmin)
      if (user.role !== ENUM_USER_ROLE.ADMIN && user.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
        if (
          (report.by && report.by.toString() === user._id.toString()) ||
          (report.user && report.user.toString() === user._id.toString())
        ) {
          throw new BadRequestException('report.error.cannotRejectOwn');
        }
      }

      await this.reportService.rejectReport(report, { reason }, { session });

      await this.databaseService.commitTransaction(session);
      return { data: report };
    } catch (err) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }

  }

  @Response('report.complete')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @AuthJwtAccessProtected()
  @Post(':id/complete')
  async complete(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.findOneById(id);
      if (!report) {
        throw new BadRequestException('report.error.notFound');
      }

      await this.reportService.completeReport(report, { session });

      await this.databaseService.commitTransaction(session);
    } catch (err) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }
  }

  @Response('report.cancel')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @AuthJwtAccessProtected()
  @Post(':id/cancel')
  async cancel(@AuthJwtPayload('user', UserParsePipe) user: UserDocument, @Param('id') id: string) {
    const session: ClientSession = await this.databaseService.createTransaction();

    try {
      const report = await this.reportService.findOneById(id);
      if (!report) {
        throw new BadRequestException('report.error.notFound');
      }

      if (report.rescuer.toString() !== user._id.toString()) {
        throw new BadRequestException('report.error.cannotCancelOther');
      }

      await this.reportService.cancelReport(report, { session });

      await this.databaseService.commitTransaction(session);
    } catch (err) {
      await this.databaseService.abortTransaction(session);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException({
        statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
        message: 'http.serverError.internalServerError',
        _error: err,
      });
    }
  }

  @Response('report.bounds')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @AuthJwtAccessProtected()
  @Get('/bounds')
  async bounds(
    @Query('minLat') minLat: number,
    @Query('maxLat') maxLat: number,
    @Query('minLng') minLng: number,
    @Query('maxLng') maxLng: number,
    @Query('limit') limit: number,
  ) {
    const reportList: IReportDocument[] = await this.reportService.findInBounds(
      Number(minLat), Number(maxLat), Number(minLng), Number(maxLng),
      { join: true, paging: { limit, offset: 0 } }
    );

    const mapList = this.reportService.mapList(reportList);

    return {
      data: mapList
    }
  }
}
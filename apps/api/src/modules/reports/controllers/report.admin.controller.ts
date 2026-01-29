import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { ReportService } from '@modules/reports/services/reports.service';
import { ReportCreateByAdminRequestDto } from '@modules/reports/dtos/request/report.create-by-admin.request.dto';
import { ReportListResponseDto } from '@modules/reports/dtos/response/report.list.reponse.dto';
import {
  AuthJwtAccessProtected,
  AuthJwtPayload
} from '@modules/auth/decorators/auth.jwt.decorator';
import {
  Response,
  ResponsePaging
} from '@common/response/decorators/response.decorator';
import {
  PaginationQuery,
  PaginationQueryFilterDate,
  PaginationQueryFilterDateTimeRange,
  PaginationQueryFilterInEnum
} from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS, ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS, ENUM_REPORT_TYPE, ENUM_REPORT_SOURCE, ENUM_USER_ROLE } from '@repo/shared';
import { BadRequestException, Param } from '@nestjs/common';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import { UsersService } from '@modules/users/services/users.service';
import { Throttle } from '@nestjs/throttler';
import { PolicyAbilityProtected } from '@modules/policy/decorators/policy.decorator';
import { PolicyAbilityGuard } from '@modules/policy/guards/policy.ability.guard';
import { ENUM_POLICY_SUBJECT, ENUM_POLICY_ACTION } from '@repo/shared';

import { UserProtected } from '@modules/users/decorators/user.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageService } from '@common/message/services/message.service';
import { ActivityCreateEvent } from '@modules/activity/events/activity.create.event';
import { ENUM_ACTIVITY_TYPE } from '@repo/shared';

import {
  REPORT_DEFAULT_AVAILABLE_ORDER_BY,
  REPORT_DEFAULT_AVAILABLE_SEARCH,
  REPORT_DEFAULT_SEVERITY,
  REPORT_DEFAULT_SOURCE,
  REPORT_DEFAULT_STATUS,
  REPORT_DEFAULT_TYPE,
} from '../constants/report.list.constant';

@Controller({
  version: '1',
  path: '/report',
})
export class ReportAdminController {
  constructor(
    private readonly reportService: ReportService,
    private readonly paginationService: PaginationService,
    private readonly paginationFilterService: PaginationService,
    private readonly userService: UsersService,
    private readonly messageService: MessageService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  // 1. API List All Reports
  @ResponsePaging('report.list')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('/list')
  async list(
    @PaginationQuery({
      defaultPerPage: 20,
      availableSearch: REPORT_DEFAULT_AVAILABLE_SEARCH,
      availableOrderBy: REPORT_DEFAULT_AVAILABLE_ORDER_BY,
    })
    { _search, _limit, _offset, _order, search }: PaginationListDto,

    // 2. Enum Filters
    @PaginationQueryFilterInEnum('severity', REPORT_DEFAULT_SEVERITY, ENUM_REPORT_SEVERITY)
    severity: Record<string, any>,

    @PaginationQueryFilterInEnum('status', REPORT_DEFAULT_STATUS, ENUM_REPORT_STATUS)
    status: Record<string, any>,

    @PaginationQueryFilterInEnum('type', REPORT_DEFAULT_TYPE, ENUM_REPORT_TYPE)
    type: Record<string, any>,

    @PaginationQueryFilterInEnum('source', REPORT_DEFAULT_SOURCE, ENUM_REPORT_SOURCE)
    source: Record<string, any>,

    // 3. Dynamic Date Filters (Y hệt App)
    @Query('dateField') rawDateField: string,
    @PaginationQueryFilterDateTimeRange('timeRange') timeRange: Date,
    @PaginationQueryFilterDate('fromDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.GREATER_THAN_EQUAL) fromDate: Date,
    @PaginationQueryFilterDate('toDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.LESS_THAN_EQUAL) toDate: Date,
    @PaginationQueryFilterDate('exactDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.EQUAL) exactDate: Date,
  ): Promise<IResponsePaging<ReportListResponseDto>> {
    let find: Record<string, any> = {
      ..._search,
      ...severity,
      ...status,
      ...type,
      ...source,
    };

    if (search) {
      const userIds = await this.userService.findAllIdsByName(search);
      find = {
        ...find,
        $or: [
          ...(_search?.$or || []),
          { user: { $in: userIds } },
        ]
      }
    }

    // B. Merge Date Filters
    const dateQuery = this.paginationFilterService.buildDateQuery(
      { dateField: rawDateField, timeRange, fromDate, toDate, exactDate },
      ['createdAt', 'updatedAt', 'deletedAt'] // Admin có thể lọc cả deletedAt nếu cần
    );
    Object.assign(find, dateQuery);

    // C. Gọi Service ADMIN (Không cần user context)
    const reports = await this.reportService.findAllByAdmin(
      find,
      {
        paging: { limit: _limit, offset: _offset },
        order: _order,
      }
    );

    // D. Tính Total ADMIN
    const total = await this.reportService.getTotal(find);
    const totalPage = this.paginationService.totalPage(total, _limit);

    return {
      _pagination: { total, totalPage },
      data: this.reportService.mapList(reports),
    };
  }

  // 2. API Create By Admin
  @Response('report.create')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.CREATE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('/create')
  async createByAdmin(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Body() body: ReportCreateByAdminRequestDto
  ) {
    const created = await this.reportService.createByAdmin(body.userId, user._id.toString(), body);

    this.eventEmitter.emit(
      'activity.create',
      new ActivityCreateEvent({
        user: body.userId,
        by: user,
        type: ENUM_ACTIVITY_TYPE.REPORT_CREATE,
        description: this.messageService.setMessage(
          'activity.report.createByAdmin',
          { properties: { id: created._id.toString() } }
        ),
        properties: { reportId: created._id.toString() }
      })
    );

    return created;
  }

  @Response('report.stats')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('/stats')
  async getStats() {
    return this.reportService.getStatistics();
  }

  @Response('report.assign')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Post(':id/assign')
  async assign(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Param('id') id: string,
    @Body() body: { volunteerId?: string; volunteerIds?: string[] }
  ) {
    const ids = body.volunteerIds || (body.volunteerId ? [body.volunteerId] : []);

    if (ids.length === 0) {
      throw new BadRequestException('report.assign.error.volunteerIdRequired');
    }

    const report = await this.reportService.findOneById(id);
    if (!report) throw new BadRequestException('report.error.notFound');

    const volunteers = await this.userService.findAll({
      _id: { $in: ids }
    });

    if (!volunteers || volunteers.length === 0) {
      throw new BadRequestException('user.error.notFound');
    }

    // Check if all found are volunteers (optional strict check, or just filter)
    const nonVolunteers = volunteers.filter(v => v.role !== ENUM_USER_ROLE.VOLUNTEER);
    if (nonVolunteers.length > 0) {
      throw new BadRequestException('user.error.notVolunteer');
    }

    const assigned = await this.reportService.assignReport(report, volunteers as UserDocument[], user);

    this.eventEmitter.emit(
      'activity.create',
      new ActivityCreateEvent({
        user: user._id,
        type: ENUM_ACTIVITY_TYPE.REPORT_ACCEPT, // Reuse accept or NEW TYPE
        description: `Admin assigned report ${id} to ${volunteers.length} volunteers`,
        properties: { reportId: String(id), volunteerIds: ids }
      })
    );

    return assigned;
  }

  @Get('export')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @AuthJwtAccessProtected()
  @UseGuards(PolicyAbilityGuard)
  async export(
    @Res() res: ExpressResponse,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const workbook = await this.reportService.exportToExcel({ start, end });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `reports_export_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
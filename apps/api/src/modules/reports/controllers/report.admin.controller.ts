import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS, ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS, ENUM_REPORT_TYPE, ENUM_REPORT_SOURCE } from '@repo/shared';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import { UsersService } from '@modules/users/services/users.service';
import { Throttle } from '@nestjs/throttler';
import { PolicyAbilityProtected } from '@modules/policy/decorators/policy.decorator';
import { ENUM_POLICY_SUBJECT, ENUM_POLICY_ACTION } from '@repo/shared';

import { UserProtected } from '@modules/users/decorators/user.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageService } from '@common/message/services/message.service';
import { ActivityCreateEvent } from '@modules/activity/events/activity.create.event';
import { ENUM_ACTIVITY_TYPE } from '@repo/shared';

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
      // Admin được search nhiều field hơn
      availableSearch: ['q', 'address', 'notes', 'regionId', 'user.fullName', 'user.mobileNumber'],
      availableOrderBy: ['createdAt', 'status', 'peopleCount', 'updatedAt'],
    })
    { _search, _limit, _offset, _order, search }: PaginationListDto,

    // 2. Enum Filters
    @PaginationQueryFilterInEnum('severity', ENUM_REPORT_SEVERITY.MEDIUM, ENUM_REPORT_SEVERITY)
    severity: ENUM_REPORT_SEVERITY[],

    @PaginationQueryFilterInEnum('status', ENUM_REPORT_STATUS.IN_PROGRESS, ENUM_REPORT_STATUS)
    status: ENUM_REPORT_STATUS[],

    @PaginationQueryFilterInEnum('type', ENUM_REPORT_TYPE.EVACUATION, ENUM_REPORT_TYPE)
    type: ENUM_REPORT_TYPE[],

    @PaginationQueryFilterInEnum('source', ENUM_REPORT_SOURCE.APP, ENUM_REPORT_SOURCE)
    source: ENUM_REPORT_SOURCE[],

    // 3. Dynamic Date Filters (Y hệt App)
    @Query('dateField') rawDateField: string,
    @PaginationQueryFilterDateTimeRange('timeRange') timeRange: Date,
    @PaginationQueryFilterDate('fromDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.GREATER_THAN_EQUAL) fromDate: Date,
    @PaginationQueryFilterDate('toDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.LESS_THAN_EQUAL) toDate: Date,
    @PaginationQueryFilterDate('exactDate', ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.EQUAL) exactDate: Date,
  ): Promise<IResponsePaging<ReportListResponseDto>> {
    let find: Record<string, any> = { ..._search };

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

    if (severity?.length) find.severity = { $in: severity };
    if (status?.length) find.status = { $in: status };
    if (type?.length) find.type = { $in: type };
    if (source?.length) find.source = { $in: source };

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
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Post('/create')
  @UserProtected()
  @AuthJwtAccessProtected()
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

  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.REPORT,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Get('/stats')
  async getStats() {
    return this.reportService.getStatistics();
  }
}
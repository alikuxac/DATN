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
  PaginationQueryFilterInEnum
} from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS } from '@repo/shared';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import { ReportListRequestDto } from '../dtos/request/report.list.request.dto';

@Controller({
  version: '1',
  path: '/report',
})
export class ReportAdminController {
  constructor(
    private readonly reportService: ReportService,
    private readonly paginationService: PaginationService
  ) { }

  // 1. API List All Reports
  @Get('/list')
  @AuthJwtAccessProtected()
  @ResponsePaging('report.list')
  async list(
    @Query() dto: ReportListRequestDto,
    @PaginationQuery({
      defaultPerPage: 30,
      availableSearch: ['address', 'notes'],
      availableOrderBy: ['createdAt', 'peopleCount'],
    })
    { _search, _limit, _offset, _order }: PaginationListDto,
    @PaginationQueryFilterInEnum('severity', ENUM_REPORT_SEVERITY.MEDIUM, ENUM_REPORT_SEVERITY)
    severity: ENUM_REPORT_SEVERITY[],
    @PaginationQueryFilterInEnum('status', ENUM_REPORT_STATUS.IN_PROGRESS, ENUM_REPORT_STATUS)
    status: ENUM_REPORT_STATUS[],
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
  ): Promise<IResponsePaging<ReportListResponseDto>> {
    const find: Record<string, any> = {
      ..._search,
    };

    if (severity && severity.length > 0) {
      find.severity = { $in: Array.isArray(severity) ? severity : [severity] };
    }
    if (status && status.length > 0) {
      find.status = { $in: status };
    }

    const reports = await this.reportService.findAll(
      find,
      {
        paging: { limit: _limit, offset: _offset },
        order: _order,
        join: true,
      },
      user,
      dto
    );

    const total: number = await this.reportService.getTotal(find);
    const totalPage: number = this.paginationService.totalPage(
      total,
      _limit
    );

    return {
      _pagination: { total, totalPage },
      data: this.reportService.mapList(reports),
    };
  }

  // 2. API Create By Admin
  @Post('/create')
  @AuthJwtAccessProtected()
  @Response('report.create')
  async createByAdmin(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Body() body: ReportCreateByAdminRequestDto
  ) {
    const created = await this.reportService.createByAdmin(body.userId, user._id.toString(), body);
    return created;
  }
}
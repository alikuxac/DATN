import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
    PaginationQuery,
    PaginationQueryFilterDate,
    PaginationQueryFilterDateTimeRange,
} from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { RequestRequiredPipe } from '@common/request/pipes/request.required.pipe';
import { ResponsePaging } from '@common/response/decorators/response.decorator';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import { ActivityListResponseDto } from '@modules/activity/dtos/response/activity.list.response.dto';
import { IActivityDoc } from '@modules/activity/interfaces/activity.interface';
import { ActivityService } from '@modules/activity/services/activity.service';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS } from '@repo/shared';

import { UserProtected } from '@modules/users/decorators/user.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';

@ApiTags('modules.shared.activity')
@Controller({
    version: '1',
    path: '/activity',
})
export class ActivitySharedController {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly activityService: ActivityService
    ) { }

    @ResponsePaging('activity.list')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Get('/list')
    async list(
        @AuthJwtPayload('user', RequestRequiredPipe, UserParsePipe)
        user: UserDocument,
        @PaginationQuery()
        { _search, _limit, _offset, _order }: PaginationListDto,
        @PaginationQueryFilterDateTimeRange('timeRange') timeRange: Date,
        @Query('dateField') rawDateField: string,
        @PaginationQueryFilterDate(
            'fromDate',
            ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.GREATER_THAN_EQUAL
        )
        fromDate: Date,
        @PaginationQueryFilterDate(
            'toDate',
            ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.LESS_THAN_EQUAL
        )
        toDate: Date,
        @PaginationQueryFilterDate(
            'exactDate',
            ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.EQUAL
        )
        exactDate: Date
    ): Promise<IResponsePaging<ActivityListResponseDto>> {
        const dateQuery = this.paginationService.buildDateQuery(
            { dateField: rawDateField, timeRange, fromDate, toDate, exactDate },
            ['createdAt']
        );

        const find: Record<string, any> = {
            ..._search,
            ...dateQuery,
        };

        const userHistories: IActivityDoc[] =
            await this.activityService.findAllByUser(user._id.toString(), find, {
                paging: {
                    limit: _limit,
                    offset: _offset,
                },
                order: _order,
            });
        const total: number = await this.activityService.getTotalByUser(
            user._id.toString(),
            find
        );
        const totalPage: number = this.paginationService.totalPage(
            total,
            _limit
        );

        const mapped = this.activityService.mapList(userHistories);

        return {
            _pagination: { total, totalPage },
            data: mapped,
        };
    }
}

import {
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Query,
} from '@nestjs/common';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import {
    PaginationQuery,
    PaginationQueryFilterDate,
    PaginationQueryFilterDateTimeRange,
} from '@common/pagination/decorators/pagination.decorator';

import { RequestRequiredPipe } from '@common/request/pipes/request.required.pipe';
import {
    Response,
    ResponsePaging,
} from '@common/response/decorators/response.decorator';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import { AuthJwtAccessProtected } from '@modules/auth/decorators/auth.jwt.decorator';
import {
    PolicyAbilityProtected,
} from '@modules/policy/decorators/policy.decorator';
import {
    ENUM_POLICY_ACTION,
    ENUM_POLICY_SUBJECT,
    ENUM_STATUS_CODE_ERROR,
    ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS,
} from '@repo/shared';

import { SessionListResponseDto } from '@modules/session/dtos/response/session.list.response.dto';
import { SessionActiveParsePipe } from '@modules/session/pipes/session.parse.pipe';
import { SessionDoc } from '@modules/session/repository/entities/session.entity';
import { SessionService } from '@modules/session/services/session.service';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { UserNotSelfPipe } from '@modules/users/pipes/users.not-self.pipe';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';

@Controller({
    version: '1',
    path: '/session/:user',
})
export class SessionAdminController {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly sessionService: SessionService
    ) { }

    @ResponsePaging('session.list')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.SESSION,
        action: [ENUM_POLICY_ACTION.READ],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Get('/list')
    async list(
        @Param('user', RequestRequiredPipe, UserParsePipe) user: UserDocument,
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
    ): Promise<IResponsePaging<SessionListResponseDto>> {
        const dateQuery = this.paginationService.buildDateQuery(
            { dateField: rawDateField, timeRange, fromDate, toDate, exactDate },
            ['createdAt']
        );

        const find: Record<string, any> = {
            ..._search,
            ...dateQuery,
        };

        const sessions: SessionDoc[] = await this.sessionService.findAllByUser(
            user._id.toString(),
            find,
            {
                paging: {
                    limit: _limit,
                    offset: _offset,
                },
                order: _order,
            }
        );
        const total: number = await this.sessionService.getTotalByUser(
            user._id.toString(),
            find
        );
        const totalPage: number = this.paginationService.totalPage(
            total,
            _limit
        );

        const mapped = this.sessionService.mapList(sessions);

        return {
            _pagination: { total, totalPage },
            data: mapped,
        };
    }

    @Response('session.revoke')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Delete('/revoke/:session')
    async revoke(
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument,
        @Param('session', RequestRequiredPipe, SessionActiveParsePipe)
        session: SessionDoc
    ): Promise<void> {
        if (user._id.toString() !== session.user) {
            throw new NotFoundException({
                statusCode: ENUM_STATUS_CODE_ERROR.SESSION_NOT_FOUND,
                message: 'session.error.notFound',
            });
        }

        await this.sessionService.updateRevoke(session);
    }
}

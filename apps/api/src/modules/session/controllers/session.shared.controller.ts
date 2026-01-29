import {
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
    PaginationQuery,
    PaginationQueryFilterDate,
    PaginationQueryFilterDateTimeRange,
} from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { RequestRequiredPipe } from '@common/request/pipes/request.required.pipe';
import {
    Response,
    ResponsePaging,
} from '@common/response/decorators/response.decorator';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { SessionListResponseDto } from '@modules/session/dtos/response/session.list.response.dto';
import {
    ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS,
    ENUM_STATUS_CODE_ERROR,
    IAuthJwtAccessTokenPayload,
    ENUM_SESSION_STATUS,
} from '@repo/shared';
import { SessionActiveByUserParsePipe, SessionActiveParsePipe, SessionParseByUserPipe } from '@modules/session/pipes/session.parse.pipe';
import { SessionDoc } from '@modules/session/repository/entities/session.entity';
import { SessionService } from '@modules/session/services/session.service';
import { UserProtected } from '@modules/users/decorators/user.decorator';

import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';

@ApiTags('modules.shared.session')
@Controller({
    version: '1',
    path: '/session',
})
@UseInterceptors(ClassSerializerInterceptor)
export class SessionSharedController {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly sessionService: SessionService
    ) { }

    @ResponsePaging('session.list')
    @UserProtected([false])
    @AuthJwtAccessProtected()
    @Get('/list')
    async list(
        @AuthJwtPayload('user') user: string,
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('session', SessionActiveParsePipe) session: SessionDoc,
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
            status: ENUM_SESSION_STATUS.ACTIVE,
        };

        const sessions: SessionDoc[] = await this.sessionService.findAllByUser(
            user,
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
            user,
            find
        );
        const totalPage: number = this.paginationService.totalPage(
            total,
            _limit
        );

        const mapped = this.sessionService.mapList(sessions).map((s) => {
            s.isCurrent = s._id === session._id;
            return s;
        });

        return {
            _pagination: { total, totalPage },
            data: mapped,
        };
    }
    @Response('session.revoke')
    @UserProtected([false])
    @AuthJwtAccessProtected()
    @Delete('/revoke/:session')
    async revoke(
        @Param('session', RequestRequiredPipe, SessionParseByUserPipe)
        session: SessionDoc,
        @AuthJwtPayload('session') sessionFromRequest: string
    ): Promise<void> {
        if (session._id === sessionFromRequest) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.SESSION_FORBIDDEN_REVOKE,
                message: 'session.error.forbiddenRevoke',
            });
        }

        await this.sessionService.updateRevoke(session);
    }
}

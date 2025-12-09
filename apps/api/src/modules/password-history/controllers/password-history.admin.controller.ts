import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaginationQuery } from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { RequestRequiredPipe } from '@common/request/pipes/request.required.pipe';
import { ResponsePaging } from '@common/response/decorators/response.decorator';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import { AuthJwtAccessProtected } from '@modules/auth/decorators/auth.jwt.decorator';
import { PasswordHistoryListResponseDto } from '@modules/password-history/dtos/response/password-history.list.response.dto';
import { IPasswordHistoryDoc } from '@modules/password-history/interfaces/password-history.interface';
import { PasswordHistoryService } from '@modules/password-history/services/password-history.service';
import {
    PolicyAbilityProtected,
} from '@modules/policy/decorators/policy.decorator';
import {
    ENUM_POLICY_ACTION,
    ENUM_POLICY_SUBJECT,
} from '@repo/shared';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';

@ApiTags('modules.admin.passwordHistory')
@Controller({
    version: '1',
    path: '/password-history/:user',
})
export class PasswordHistoryAdminController {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly passwordHistoryService: PasswordHistoryService
    ) {}

    @ResponsePaging('passwordHistory.list')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.ACTIVITY,
        action: [ENUM_POLICY_ACTION.READ],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Get('/list')
    async list(
        @Param('user', RequestRequiredPipe, UserParsePipe) user: UserDocument,
        @PaginationQuery()
        { _limit, _offset, _order }: PaginationListDto
    ): Promise<IResponsePaging<PasswordHistoryListResponseDto>> {
        const passwordHistories: IPasswordHistoryDoc[] =
            await this.passwordHistoryService.findAllByUser(
                user._id.toString(),
                {},
                {
                    paging: {
                        limit: _limit,
                        offset: _offset,
                    },
                    order: _order,
                }
            );
        const total: number = await this.passwordHistoryService.getTotalByUser(
            user._id.toString(),
            {}
        );
        const totalPage: number = this.paginationService.totalPage(
            total,
            _limit
        );

        const mapped = this.passwordHistoryService.mapList(passwordHistories);

        return {
            _pagination: { total, totalPage },
            data: mapped,
        };
    }
}

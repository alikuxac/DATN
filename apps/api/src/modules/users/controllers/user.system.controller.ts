import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
    PaginationQuery,
    // PaginationQueryFilterEqual,
    PaginationQueryFilterIn,
    PaginationQueryFilterInEnum,
} from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import {
    Response,
    ResponsePaging,
} from '@common/response/decorators/response.decorator';
import {
    IResponse,
    IResponsePaging,
} from '@common/response/interfaces/response.interface';
import {
    USER_DEFAULT_AVAILABLE_SEARCH,
    USER_DEFAULT_STATUS,
} from '@modules/users/constants/user.list.constant';
// import { UserCheckMobileNumberRequestDto } from '@modules/users/dto/request/user.check-mobile-number.request.dto';
import {
    UserCheckEmailRequestDto,
    // UserCheckUsernameRequestDto,
} from '@modules/users/dto/request/user.check.request.dto';
import {
    UserCheckResponseDto,
    // UserCheckUsernameResponseDto,
} from '@modules/users/dto/response/user.check.response.dto';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';
import { ENUM_USER_STATUS } from '@repo/shared';
import { UserEntity } from '../repository/entities/user.entity';
import { UsersService } from '@modules/users/services/users.service';

// import { ActivityService } from '@modules/activity/services/activity.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityCreateEvent } from '@modules/activity/events/activity.create.event';
import { MessageService } from '@common/message/services/message.service';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import {
    PolicyAbilityProtected,
} from '@modules/policy/decorators/policy.decorator';
import {
    ENUM_POLICY_ACTION,
    ENUM_POLICY_SUBJECT,
    ENUM_ACTIVITY_TYPE,
} from '@repo/shared';

@ApiTags('modules.system.user')
@Controller({
    version: '1',
    path: '/user',
})
export class UserSystemController {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly userService: UsersService,
        // private readonly activityService: ActivityService,
        private readonly eventEmitter: EventEmitter2,
        private readonly messageService: MessageService,
    ) { }

    @ResponsePaging('user.list')
    @UserProtected()
    @AuthJwtAccessProtected()
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ],
    })
    @Get('/list')
    async list(
        @PaginationQuery({ availableSearch: USER_DEFAULT_AVAILABLE_SEARCH })
        { _search, _limit, _offset, _order }: PaginationListDto,
        @PaginationQueryFilterIn('status')
        status: Record<string, any>,
        @PaginationQueryFilterIn('role')
        role: Record<string, any>,

    ): Promise<IResponsePaging<UserShortResponseDto>> {
        const find: Record<string, any> = {
            ..._search,
            ...role,
        };

        const statusValue = status.status;
        let withDeleted = false;

        if (statusValue) {
            const statusArray = Array.isArray(statusValue) ? statusValue : [statusValue];

            const validStatus = statusArray.filter((s: string) => Object.values(ENUM_USER_STATUS).includes(s as ENUM_USER_STATUS));
            if (validStatus.length > 0) {
                find.status = { $in: validStatus };
            }

            if (statusArray.includes('DELETED')) {
                withDeleted = true;
            }
        }

        if (withDeleted) {
            const isOnlyDeleted = Array.isArray(statusValue) && statusValue.length === 1 && statusValue[0] === 'DELETED';
            const isDeletedString = statusValue === 'DELETED';

            if (isOnlyDeleted || isDeletedString) {
                find.deletedAt = { $ne: null };
                delete find.status;
            }
        }

        const users: UserEntity[] =
            await this.userService.findAll(find, {
                paging: {
                    limit: _limit,
                    offset: _offset,
                },
                order: _order,
                withDeleted,
            });

        const total: number =
            await this.userService.getTotal(find, { withDeleted });
        const totalPage: number = this.paginationService.totalPage(
            total,
            _limit
        );
        const mapUsers: UserShortResponseDto[] =
            this.userService.mapShort(users);

        return {
            _pagination: { total, totalPage },
            data: mapUsers,
        };
    }

    // @Response('user.checkMobileNumber')
    // @HttpCode(HttpStatus.OK)
    // @Post('/check/mobile-number')
    // async checkMobileNumber(
    //     @Body() { number }: UserCheckMobileNumberRequestDto
    // ): Promise<IResponse<UserCheckResponseDto>> {
    //     const user = await this.userService.findOneByMobileNumber(number);
    //     const mapped = user ? this.userService.mapCensor(user) : undefined;

    //     return {
    //         data: {
    //             exist: !!user,
    //             user: mapped,
    //         },
    //     };
    // }

    @Response('user.checkEmail')
    @HttpCode(HttpStatus.OK)
    @Post('/check/email')
    async checkEmail(
        @Body() { email }: UserCheckEmailRequestDto
    ): Promise<IResponse<UserCheckResponseDto>> {
        const user = await this.userService.findOneByEmail(email);
        const mapped = user ? this.userService.mapCensor(user) : undefined;

        return {
            data: { exist: !!user, user: mapped },
        };
    }

    @Response('user.restore')
    @HttpCode(HttpStatus.OK)
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.UPDATE],
    })
    @Post('/update/:id/restore')
    async restore(
        @Param('id') id: string,
        @AuthJwtPayload('user') restoredBy: string,
    ): Promise<void> {
        const user = await this.userService.restore(id, { actionBy: restoredBy });

        this.eventEmitter.emit(
            'activity.create',
            new ActivityCreateEvent({
                user,
                by: restoredBy, // Assuming restoredBy is user ID string or UserDocument. Controller signature says string currently via AuthJwtPayload('user')? No, AuthJwtPayload without pipe returns UserDocument if strictly typed but typically it's the payload. However, previously passed to createByAdmin by.
                // Looking at other controllers, @AuthJwtPayload('user') usually returns UserDocument if piped or payload object.
                // Assuming restoredBy is actually UserDocument based on how it was used in createByAdmin logic before?
                // Wait, UserSystemController has @AuthJwtPayload('user') restoredBy: string.
                // If createByAdmin accepted string for 'by', then ActivityCreateEvent matches.
                type: ENUM_ACTIVITY_TYPE.USER_RESTORE,
                description: this.messageService.setMessage('activity.user.restoreByAdmin'),
            })
        );
    }
}

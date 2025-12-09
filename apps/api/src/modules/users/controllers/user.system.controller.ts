import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
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

@ApiTags('modules.system.user')
@Controller({
    version: '1',
    path: '/user',
})
export class UserSystemController {
    constructor(
        private readonly paginationService: PaginationService,
        private readonly userService: UsersService
    ) {}

    @ResponsePaging('user.list')
    @Get('/list')
    async list(
        @PaginationQuery({ availableSearch: USER_DEFAULT_AVAILABLE_SEARCH })
        { _search, _limit, _offset, _order }: PaginationListDto,
        @PaginationQueryFilterInEnum(
            'status',
            USER_DEFAULT_STATUS,
            ENUM_USER_STATUS
        )
        status: Record<string, any>,
        @PaginationQueryFilterIn('role')
        role: Record<string, any>,

    ): Promise<IResponsePaging<UserShortResponseDto>> {
        const find: Record<string, any> = {
            ..._search,
            ...role,
            ...status,
        };

        const users: UserEntity[] =
            await this.userService.findAll(find, {
                paging: {
                    limit: _limit,
                    offset: _offset,
                },
                order: _order,
            });

        const total: number =
            await this.userService.getTotal(find);
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
}

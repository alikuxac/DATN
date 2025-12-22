import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Put,
} from '@nestjs/common';
import { PaginationService } from '@common/pagination/services/pagination.service';
import {
    Response,
    ResponsePaging,
} from '@common/response/decorators/response.decorator';
import {
    IResponse,
    IResponsePaging,
} from '@common/response/interfaces/response.interface';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import {
    PaginationQuery,
    PaginationQueryFilterIn,
    PaginationQueryFilterInEnum,
} from '@common/pagination/decorators/pagination.decorator';
import {
    PolicyAbilityProtected,
} from '@modules/policy/decorators/policy.decorator';
import {
    ENUM_POLICY_ACTION,
    ENUM_POLICY_SUBJECT,
    ENUM_USER_ROLE,
    ENUM_USER_SIGN_UP_FROM,
    ENUM_USER_STATUS,
    IAuthJwtAccessTokenPayload
} from '@repo/shared';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { RequestRequiredPipe } from '@common/request/pipes/request.required.pipe';
import { IAuthPassword } from '@modules/auth/interfaces/auth.interface';
import { AuthService } from '@modules/auth/services/auth.service';
import { ClientSession } from 'mongoose';
import { UserListResponseDto } from '@modules/users/dto/response/user.list.response.dto';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserProfileResponseDto } from '@modules/users/dto/response/user.profile.response.dto';
import { UsersService } from '@modules/users/services/users.service';
import {
    USER_DEFAULT_AVAILABLE_SEARCH,
    USER_DEFAULT_STATUS,
} from '@modules/users/constants/user.list.constant';
import { UserDocument, UserEntity } from '@modules/users/repository/entities/user.entity';
import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';
import { UserNotSelfPipe } from '@modules/users/pipes/users.not-self.pipe';
import { UserUpdateRequestDto } from '@modules/users/dto/request/user.update.request.dto';
import { DatabaseIdResponseDto } from '@common/database/dtos/response/database.id.response.dto';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { Queue } from 'bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { PasswordHistoryService } from '@modules/password-history/services/password-history.service';
import { ActivityService } from '@modules/activity/services/activity.service';
import { MessageService } from '@common/message/services/message.service';
import { InjectQueue } from '@nestjs/bullmq';
import { UserUpdateStatusRequestDto } from '@modules/users/dto/request/user.update-status.request.dto';
import { VerificationService } from '@modules/verification/services/verification.service';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { DatabaseService } from '@common/database/services/database.service';
import { ENUM_STATUS_CODE_ERROR, ENUM_PASSWORD_HISTORY_TYPE, } from '@repo/shared';
import { HeaderLang } from '@common/message/decorators/message.decorator';
@Controller({
    version: '1',
    path: '/user',
})
export class UserAdminController {
    constructor(
        private readonly databaseService: DatabaseService,
        @InjectQueue(ENUM_WORKER_QUEUES.EMAIL_QUEUE)
        private readonly emailQueue: Queue,
        private readonly paginationService: PaginationService,
        private readonly authService: AuthService,
        private readonly userService: UsersService,
        private readonly passwordHistoryService: PasswordHistoryService,
        private readonly activityService: ActivityService,
        private readonly messageService: MessageService,
        private readonly verificationService: VerificationService
    ) { }

    @ResponsePaging('user.list')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Get('/list')
    async list(
        @PaginationQuery({
            availableSearch: USER_DEFAULT_AVAILABLE_SEARCH,
        })
        { _search, _limit, _offset, _order }: PaginationListDto,
        @PaginationQueryFilterInEnum(
            'status',
            USER_DEFAULT_STATUS,
            ENUM_USER_STATUS
        )
        status: Record<string, any>,
        @PaginationQueryFilterIn('role')
        role: Record<string, any>,
    ): Promise<IResponsePaging<UserListResponseDto>> {
        const find: Record<string, any> = {
            ..._search,
            ...status,
            ...role,
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

        const mapped = this.userService.mapList(users);

        return {
            _pagination: { total, totalPage },
            data: mapped,
        };
    }

    @Response('user.get')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ],
    })
    // @UserProtected()
    // @AuthJwtAccessProtected()
    @Get('/get/:user')
    async get(
        @Param('user', RequestRequiredPipe, UserParsePipe) user: UserDocument
    ): Promise<IResponse<UserProfileResponseDto>> {
        const mapped: UserProfileResponseDto =
            this.userService.mapProfile(user);

        return { data: mapped };
    }

    @Response('user.create')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.CREATE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Post('/create')
    async create(
        @HeaderLang() lang: string,
        @AuthJwtPayload('user') createBy: string,
        @Body()
        dto: UserCreateRequestDto
    ): Promise<IResponse<DatabaseIdResponseDto>> {
        const { email } = dto;
        const promises: Promise<any>[] = [
            this.userService.existByEmail(email),
        ];

        const [emailExist] =
            await Promise.all(promises);

        if (emailExist) {
            throw new ConflictException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_EMAIL_EXIST,
                message: 'user.error.emailExist',
            });
        }

        const passwordString = this.authService.createPasswordRandom();
        const password: IAuthPassword = this.authService.createPassword(
            passwordString,
            {
                temporary: true,
            }
        );

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            const created = await this.userService.create(
                dto,
                password,
                ENUM_USER_SIGN_UP_FROM.ADMIN,
                { session }
            );

            const verification =
                await this.verificationService.createEmailByUser(created, {
                    session,
                });
            await this.passwordHistoryService.createByAdmin(
                created,
                {
                    by: createBy,
                    type: ENUM_PASSWORD_HISTORY_TYPE.SIGN_UP,
                },
                { session }
            );
            await this.activityService.createByAdmin(
                created,
                {
                    by: createBy,
                    description: this.messageService.setMessage(
                        'activity.user.createByAdmin'
                    ),
                },
                { session }
            );

            const fullName = lang === 'vi' ? `${created.firstName} ${created.lastName}` : `${created.lastName} ${created.firstName}`

            await Promise.all([
                this.emailQueue.add(
                    ENUM_SEND_EMAIL_PROCESS.CREATE,
                    {
                        send: { email: created.email, name: fullName, lang },
                        data: {
                            passwordExpiredAt: password.passwordExpired,
                            password: passwordString,
                        },
                    },
                    {
                        debounce: {
                            id: `${ENUM_SEND_EMAIL_PROCESS.CREATE}-${created._id}`,
                            ttl: 1000,
                        },
                    }
                ),
                this.emailQueue.add(
                    ENUM_SEND_EMAIL_PROCESS.VERIFICATION,
                    {
                        send: { email, name: fullName, lang },
                        data: {
                            otp: verification.otp,
                            expiredAt: verification.expiredDate,
                            reference: verification.reference,
                        },
                    },
                    {
                        debounce: {
                            id: `${ENUM_SEND_EMAIL_PROCESS.VERIFICATION}-${created._id}`,
                            ttl: 1000,
                        },
                    }
                ),
            ]);

            await this.databaseService.commitTransaction(session);

            return {
                data: { _id: created._id.toString() },
            };
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.update')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.UPDATE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Put('/update/:user')
    async update(
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument,
        @Body() dto: UserUpdateRequestDto
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.update(
                user,
                dto,
                { session }
            );

            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        'activity.user.updateByAdmin'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.updateStatus')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.UPDATE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Patch('/update/:user/status')
    async updateStatus(
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument,
        @Body() { status }: UserUpdateStatusRequestDto
    ): Promise<IResponse<void>> {
        if (user.status === ENUM_USER_STATUS.INACTIVE) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_STATUS_INVALID,
                message: 'user.error.statusInvalid',
                _metadata: {
                    customProperty: {
                        messageProperties: {
                            status: status.toLowerCase(),
                        },
                    },
                },
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateStatus(user, { status }, { session });

            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        `activity.user.${status.toLowerCase()}ByAdmin`
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);

            return {
                _metadata: {
                    customProperty: {
                        messageProperties: {
                            status: status.toLowerCase(),
                        },
                    },
                },
            };
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.getNearbyVolunteers')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Get('/volunteer/nearby')
    async getNearbyVolunteers(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument
    ): Promise<void> {
        if ([ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN].includes(user.role)) {
            await this.userService.getNearbyVolunteer(user);
        }
    }
}

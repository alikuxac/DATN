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
    ForbiddenException,
    Delete,
    Query,
} from '@nestjs/common';
import { EventEmitter2 } from "@nestjs/event-emitter";
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
    IAuthJwtAccessTokenPayload,
    ENUM_NOTIFICATION_TYPE
} from '@repo/shared';
import { NotificationService } from '@modules/notifications/notification.service';
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
import { UserUpdateMobileNumberRequestDto } from '@modules/users/dto/request/user.update-mobile-number.request.dto';
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
import { UserUpdateRoleRequestDto } from '@modules/users/dto/request/user.update-role.request.dto';
import { Throttle } from '@nestjs/throttler';

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
        private readonly verificationService: VerificationService,
        private readonly notificationService: NotificationService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    @ResponsePaging('user.list')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Get('/list')
    async list(
        @PaginationQuery({
            availableSearch: USER_DEFAULT_AVAILABLE_SEARCH,
        })
        { _search, _limit, _offset, _order, search }: PaginationListDto,
        @PaginationQueryFilterInEnum(
            'status',
            USER_DEFAULT_STATUS,
            ENUM_USER_STATUS
        )
        status: Record<string, any>,
        @PaginationQueryFilterIn('role')
        role: Record<string, any>,
    ): Promise<IResponsePaging<UserListResponseDto>> {
        let find: Record<string, any> = {
            ..._search,
            ...status,
            ...role,
        };

        if (search) {
            find = {
                ...find,
                $or: [
                    ...(_search?.$or || []),
                    {
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $concat: ['$lastName', ' ', '$firstName'],
                                },
                                regex: search,
                                options: 'i',
                            },
                        },
                    },
                    {
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $concat: ['$firstName', ' ', '$lastName'],
                                },
                                regex: search,
                                options: 'i',
                            },
                        },
                    },
                ],
            };
        }

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
    @Throttle({ default: { limit: 100, ttl: 60000 } })
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
    @Throttle({ default: { limit: 100, ttl: 60000 } })
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
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Put('/update/:user')
    async update(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe) requestUser: UserDocument,
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

            await this.activityService.createByAdmin(
                user,
                {
                    by: requestUser._id.toString(),
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

    @Response('user.resetPassword')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.UPDATE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Patch('/update/:user/reset-password')
    async resetPassword(
        @HeaderLang() lang: string,
        @AuthJwtPayload('user') createBy: string,
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe) requestUser: UserDocument,
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument
    ): Promise<IResponse<void>> {
        if (user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_SUPER_ADMIN,
                message: 'user.error.isSuperAdmin',
            });
        }

        if (user.role === ENUM_USER_ROLE.ADMIN && requestUser.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_ADMIN,
                message: 'user.error.isAdmin',
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
            await this.userService.updatePassword(user, password, { session });
            await this.userService.resetPasswordAttempt(user, { session });

            await this.activityService.createByAdmin(
                user,
                {
                    by: createBy,
                    description: this.messageService.setMessage(
                        'activity.user.resetPasswordByAdmin'
                    ),
                },
                { session }
            );

            const fullName = lang === 'vi' ? `${user.firstName} ${user.lastName}` : `${user.lastName} ${user.firstName}`

            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.CREATE,
                {
                    send: { email: user.email, name: fullName, lang },
                    data: {
                        passwordExpiredAt: password.passwordExpired,
                        password: passwordString,
                    },
                },
                {
                    debounce: {
                        id: `${ENUM_SEND_EMAIL_PROCESS.CREATE}-${user._id}`,
                        ttl: 1000,
                    },
                }
            );

            await this.databaseService.commitTransaction(session);

            return {};
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.updateRole')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.UPDATE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Patch('/update/:user/role')
    async updateRole(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe) requestUser: UserDocument,
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument,
        @Body() { role }: UserUpdateRoleRequestDto
    ): Promise<IResponse<void>> {
        // 1. Cannot change role of SUPER_ADMIN
        if (user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_SUPER_ADMIN,
                message: 'user.error.isSuperAdmin',
            });
        }

        // 2. Only SUPER_ADMIN can change role of ADMIN
        if (user.role === ENUM_USER_ROLE.ADMIN && requestUser.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_ADMIN,
                message: 'user.error.isAdmin',
            });
        }

        // 3. Only SUPER_ADMIN can promote to ADMIN or SUPER_ADMIN
        if ([ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN].includes(role) && requestUser.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_ADMIN, // Reusing error or creating new one? Using generic forbidden for now or standard error
                message: 'user.error.forbidden',
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateRole(user, { role }, { session });

            await this.activityService.createByAdmin(
                user,
                {
                    by: requestUser._id.toString(),
                    description: this.messageService.setMessage(
                        'activity.user.updateRoleByAdmin'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);

            return {};
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
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Patch('/update/:user/status')
    async updateStatus(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe) requestUser: UserDocument,
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

        if (user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_SUPER_ADMIN,
                message: 'user.error.isSuperAdmin',
            });
        }

        if (user.role === ENUM_USER_ROLE.ADMIN && requestUser.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_ADMIN,
                message: 'user.error.isAdmin',
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateStatus(user, { status }, { session });

            await this.activityService.createByAdmin(
                user,
                {
                    by: requestUser._id.toString(),
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

    @Response('user.updateMobileNumber')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.UPDATE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Patch('/update/:user/mobile-number')
    async updateMobileNumber(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe) requestUser: UserDocument,
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument,
        @Body() { number }: UserUpdateMobileNumberRequestDto
    ): Promise<IResponse<void>> {
        // 1. Cannot change number of SUPER_ADMIN
        if (user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_SUPER_ADMIN,
                message: 'user.error.isSuperAdmin',
            });
        }

        // 2. Only SUPER_ADMIN can change number of ADMIN
        if (user.role === ENUM_USER_ROLE.ADMIN && requestUser.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_ADMIN,
                message: 'user.error.isAdmin',
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.updateMobileNumber(user, number, { session });

            // The requirement says: "notify user".
            // "khi admin điều chỉnh số điện thoại của user trên dashboard... kèm theo thông báo"
            // And user has to verify again. so we DO NOT verify it here.

            // await this.userService.updateVerificationMobileNumber(user, { session });

            await this.activityService.createByAdmin(
                user,
                {
                    by: requestUser._id.toString(),
                    description: this.messageService.setMessage(
                        'activity.user.updateMobileNumberByAdmin'
                    ),
                },
                { session }
            );

            // Notify User
            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.UPDATE_PHONE, // Generic Send or create a new process?
                {
                    send: { email: user.email, name: user.firstName, lang: user.preferences.language },
                    data: {
                        mobileNumber: number
                    },
                },
                {
                    debounce: {
                        id: `UPDATE_PHONE-${user._id}`,
                        ttl: 1000,
                    },
                }
            );
            // NOTE: Email template for this needs to be created or handled. 
            // For now, assume generic notification or skip detailed template implementation unless asked.

            await this.databaseService.commitTransaction(session);

            return {};
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('user.volunteer.nearby')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Get('/volunteer/nearby')
    async getNearbyVolunteers(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument,
        @Query('lat') lat?: number,
        @Query('lng') lng?: number
    ): Promise<IResponse<UserListResponseDto[]>> {
        if ([ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN].includes(user.role)) {
            const volunteers = await this.userService.getNearbyVolunteer(user, lat, lng);

            if (!volunteers || volunteers.length === 0) {
                throw new BadRequestException({
                    statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
                    message: 'user.error.noVolunteersFound',
                });
            }

            const top5 = volunteers.slice(0, 5);
            this.eventEmitter.emit('user.volunteer.request_support', { volunteers: top5, coordinates: { lat, lng } });

            return {
                data: this.userService.mapList(top5)
            };
        }
        return { data: [] };
    }

    @Response('user.delete')
    @PolicyAbilityProtected({
        subject: ENUM_POLICY_SUBJECT.USER,
        action: [ENUM_POLICY_ACTION.READ, ENUM_POLICY_ACTION.DELETE],
    })
    @UserProtected()
    @AuthJwtAccessProtected()
    @Throttle({ default: { limit: 100, ttl: 60000 } })
    @Delete('/delete/:user')
    async delete(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe) requestUser: UserDocument,
        @Param('user', RequestRequiredPipe, UserParsePipe, UserNotSelfPipe)
        user: UserDocument
    ): Promise<void> {
        // 1. Cannot delete SUPER_ADMIN
        if (user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_SUPER_ADMIN,
                message: 'user.error.isSuperAdmin',
            });
        }

        // 2. Only SUPER_ADMIN can delete ADMIN
        if (user.role === ENUM_USER_ROLE.ADMIN && requestUser.role !== ENUM_USER_ROLE.SUPER_ADMIN) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_IS_ADMIN,
                message: 'user.error.isAdmin',
            });
        }

        const session: ClientSession = await this.databaseService.createTransaction();

        try {
            await this.userService.softDelete(user, {
                session,
                actionBy: requestUser._id.toString()
            });

            await this.activityService.createByAdmin(
                user,
                {
                    by: requestUser._id.toString(),
                    description: this.messageService.setMessage(
                        'activity.user.deleteByAdmin'
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
}

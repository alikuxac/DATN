import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    Param,
    Post,
} from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { UsersService } from '@modules/users/services/users.service';
import { ApiTags } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageService } from '@common/message/services/message.service';
import { ActivityCreateEvent } from '@modules/activity/events/activity.create.event';
import { ENUM_ACTIVITY_TYPE } from '@repo/shared';
import { IResponse } from '@common/response/interfaces/response.interface';
import { ResetPasswordCreateRequestDto } from '@modules/reset-password/dtos/request/reset-password.create.request.dto';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { ResetPasswordService } from '@modules/reset-password/services/reset-password.service';
import { ResetPasswordCreteResponseDto } from '@modules/reset-password/dtos/response/reset-password.create.response.dto';
import { IResetPasswordRequest } from '@modules/reset-password/interfaces/reset-password.interface';
import { Response } from '@common/response/decorators/response.decorator';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { InjectQueue } from '@nestjs/bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { Queue } from 'bullmq';
import { PasswordHistoryService } from '@modules/password-history/services/password-history.service';
import { ResetPasswordParseByTokenPipe } from '@modules/reset-password/pipes/reset-password.parse.pipe';
import { RequestRequiredPipe } from '@common/request/pipes/request.required.pipe';
import { ResetPasswordActivePipe } from '@modules/reset-password/pipes/reset-password.active.pipe';
import { ResetPasswordExpiredPipe } from '@modules/reset-password/pipes/reset-password.expired.pipe';
import { ResetPasswordDoc } from '@modules/reset-password/repository/entities/reset-password.entity';
import { ResetPasswordResetRequestDto } from '@modules/reset-password/dtos/request/reset-password.reset.request.dto';
import { AuthService } from '@modules/auth/services/auth.service';
import { IAuthPassword } from '@modules/auth/interfaces/auth.interface';
import { ResetPasswordVerifyRequestDto } from '@modules/reset-password/dtos/request/reset-password.verify.request.dto';
import { DatabaseService } from '@common/database/services/database.service';
import { ENUM_PASSWORD_HISTORY_TYPE, ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { HeaderLang } from '@common/message/decorators/message.decorator';

@ApiTags('modules.public.resetPassword')
@Controller({
    version: '1',
    path: '/reset-password',
})
export class ResetPasswordPublicController {
    constructor(
        private readonly databaseService: DatabaseService,
        @InjectQueue(ENUM_WORKER_QUEUES.EMAIL_QUEUE)
        private readonly emailQueue: Queue,
        private readonly userService: UsersService,
        private readonly passwordHistoryService: PasswordHistoryService,
        private readonly authService: AuthService,
        private readonly resetPasswordService: ResetPasswordService,
        private readonly messageService: MessageService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    @Response('resetPassword.request')
    @HttpCode(HttpStatus.OK)
    @Post('/request')
    async request(
        @HeaderLang() lang: string,
        @Body() { email }: ResetPasswordCreateRequestDto
    ): Promise<IResponse<ResetPasswordCreteResponseDto>> {
        const user: UserDocument =
            await this.userService.findOneActiveByEmail(email);
        if (!user) {
            throw new NotFoundException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
                message: 'user.error.notFound',
            });
        }

        const checkLatest: IResetPasswordRequest =
            await this.resetPasswordService.checkActiveLatestEmailByUser(
                user._id.toString()
            );
        if (checkLatest) {
            return {
                data: checkLatest.created,
            };
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.resetPasswordService.inactiveEmailManyByUser(user._id.toString(), {
                session,
            });

            const resetPassword =
                await this.resetPasswordService.requestEmailByUser(
                    user._id.toString(),
                    {
                        email,
                    },
                    { session }
                );


            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.RESET_PASSWORD,
                {
                    send: { email, name: user.firstName, lang },
                    data: {
                        password: resetPassword.resetPassword.otp,
                        expiredDate: resetPassword.created.expiredDate,
                    },
                },
                {
                    debounce: {
                        id: `${ENUM_SEND_EMAIL_PROCESS.RESET_PASSWORD}-${user._id}`,
                        ttl: 1000,
                    },
                }
            );

            this.eventEmitter.emit(
                'activity.create',
                new ActivityCreateEvent({
                    user,
                    type: ENUM_ACTIVITY_TYPE.USER_RESET_PASSWORD_REQUEST,
                    description: this.messageService.setMessage(
                        'activity.user.resetPasswordRequest'
                    ),
                    session
                })
            );

            await this.databaseService.commitTransaction(session);

            return {
                data: resetPassword.created,
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

    @Response('resetPassword.get')
    @HttpCode(HttpStatus.OK)
    @Post('/get/:token')
    async get(
        @Param(
            'token',
            RequestRequiredPipe,
            ResetPasswordParseByTokenPipe,
            ResetPasswordActivePipe,
            ResetPasswordExpiredPipe
        )
        resetPassword: ResetPasswordDoc
    ): Promise<IResponse<ResetPasswordCreteResponseDto>> {
        const user = await this.userService.findOneById(resetPassword.user);
        if (!user) {
            throw new NotFoundException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
                message: 'user.error.notFound',
            });
        }

        const mapped = this.resetPasswordService.mapResetPasswordResponse(
            resetPassword,
            {
                email: user.email,
            }
        );

        return {
            data: mapped,
        };
    }

    @Response('resetPassword.verify')
    @HttpCode(HttpStatus.OK)
    @Post('/verify/:token')
    async verify(
        @Param(
            'token',
            RequestRequiredPipe,
            ResetPasswordParseByTokenPipe,
            ResetPasswordActivePipe,
            ResetPasswordExpiredPipe
        )
        resetPassword: ResetPasswordDoc,
        @Body()
        { otp }: ResetPasswordVerifyRequestDto
    ): Promise<void> {
        const user = await this.userService.findOneById(resetPassword.user);
        if (!user) {
            throw new NotFoundException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
                message: 'user.error.notFound',
            });
        }

        const check: boolean = this.resetPasswordService.checkOtp(
            resetPassword.otp,
            otp
        );
        if (!check) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.VERIFICATION_OTP_NOT_MATCH,
                message: 'resetPassword.error.otpNotMatch',
            });
        }

        await this.resetPasswordService.verify(resetPassword);

        this.eventEmitter.emit(
            'activity.create',
            new ActivityCreateEvent({
                user,
                type: ENUM_ACTIVITY_TYPE.USER_RESET_PASSWORD_VERIFY,
                description: this.messageService.setMessage(
                    'activity.user.resetPasswordVerify'
                ),
            })
        );

        return;
    }

    @Response('resetPassword.reset')
    @HttpCode(HttpStatus.OK)
    @Post('/reset/:token')
    async reset(
        @HeaderLang() lang: string,
        @Param(
            'token',
            RequestRequiredPipe,
            ResetPasswordParseByTokenPipe,
            ResetPasswordActivePipe,
            ResetPasswordExpiredPipe
        )
        resetPassword: ResetPasswordDoc,
        @Body()
        { newPassword }: ResetPasswordResetRequestDto
    ): Promise<void> {
        let user = await this.userService.findOneById(resetPassword.user);
        if (!user) {
            throw new NotFoundException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
                message: 'user.error.notFound',
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            const password: IAuthPassword =
                this.authService.createPassword(newPassword);

            user = await this.userService.updatePassword(user, password, {
                session,
            });
            await this.resetPasswordService.reset(resetPassword, {
                session,
            });
            await this.passwordHistoryService.createByUser(user, {
                type: ENUM_PASSWORD_HISTORY_TYPE.FORGOT,
            });

            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD,
                {
                    send: { email: user.email, name: user.firstName, lang },
                },
                {
                    debounce: {
                        id: `${ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD}-${user._id}`,
                        ttl: 1000,
                    },
                }
            );

            this.eventEmitter.emit(
                'activity.create',
                new ActivityCreateEvent({
                    user,
                    type: ENUM_ACTIVITY_TYPE.USER_RESET_PASSWORD, // Using generic reset password type or specific? Enum has USER_RESET_PASSWORD.
                    description: this.messageService.setMessage(
                        'activity.user.resetPassword'
                    ),
                    session
                })
            );

            await this.databaseService.commitTransaction(session);

            return;
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

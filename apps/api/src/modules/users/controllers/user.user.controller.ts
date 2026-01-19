import {
    // BadRequestException,
    // Body,
    // ConflictException,
    Controller,
    Delete,
    InternalServerErrorException,
    // NotFoundException,
    // Put,
} from '@nestjs/common';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { Response } from '@common/response/decorators/response.decorator';
import { UsersService } from '@modules/users/services/users.service';
// import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { ClientSession } from 'mongoose';
import { ActivityService } from '@modules/activity/services/activity.service';
import { MessageService } from '@common/message/services/message.service';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { SessionService } from '@modules/session/services/session.service';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { DatabaseService } from '@common/database/services/database.service';
import { TelegramService } from '@common/telegram/services/telegram.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Post, Body, BadRequestException } from '@nestjs/common';
import parsePhoneNumber from 'libphonenumber-js';
import { UserSendOtpRequestDto } from '../dto/request/user.send-otp.request.dto';
import { UserVerifyOtpRequestDto } from '../dto/request/user.verify-otp.request.dto';
// import { ENUM_USER_STATUS_CODE_ERROR } from '../enums/user.status-code.enum';

@Controller({
    version: '1',
    path: '/user',
})
export class UserUserController {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly userService: UsersService,
        private readonly activityService: ActivityService,
        private readonly messageService: MessageService,
        private readonly sessionService: SessionService,
        private readonly telegramService: TelegramService,
        @InjectQueue(ENUM_WORKER_QUEUES.EMAIL_QUEUE)
        private readonly emailQueue: Queue,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }

    @Response('user.delete')
    @UserProtected([false])
    @AuthJwtAccessProtected()
    @Delete('/delete')
    async delete(
        @AuthJwtPayload('user', UserParsePipe) user: UserDocument
    ): Promise<void> {
        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.userService.softDelete(user, {
                session,
                actionBy: user._id.toString(),
            });

            await this.activityService.createByUser(
                user,
                {
                    description:
                        this.messageService.setMessage('activity.delete'),
                },
                { session }
            );

            await this.sessionService.updateManyRevokeByUser(user._id.toString(), {
                session,
            });

            await this.databaseService.commitTransaction(session);
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }

        return;
    }

    // @Response('user.updateMobileNumber')
    // @UserProtected()
    // @AuthJwtAccessProtected()
    // @Put('/update/mobile-number')
    // async updateMobileNumber(
    //     @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    //     @Body()
    //     { number, country }: UserUpdateMobileNumberRequestDto
    // ): Promise<void> {
    //     const checkValidMobileNumber = this.userService.checkMobileNumber(
    //         number,
    //         country
    //     );
    //     if (!checkValidMobileNumber) {
    //         throw new BadRequestException({
    //             statusCode: ENUM_STATUS_CODE_ERROR.USER_MOBILE_NUMBER_INVALID,
    //             message: 'user.error.mobileNumberInvalid',
    //         });
    //     }

    //     const session: ClientSession =
    //         await this.databaseService.createTransaction();

    //     try {
    //         await this.userService.updateMobileNumber(
    //             user,
    //             { number, country },
    //             { session }
    //         );
    //         await this.activityService.createByUser(
    //             user,
    //             {
    //                 description: this.messageService.setMessage(
    //                     'activity.user.updateMobileNumber'
    //                 ),
    //             },
    //             { session }
    //         );

    //         await this.databaseService.commitTransaction(session);
    //     } catch (err: unknown) {
    //         await this.databaseService.abortTransaction(session);

    //         throw new InternalServerErrorException({
    //             statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
    //             message: 'http.serverError.internalServerError',
    //             _error: err,
    //         });
    //     }

    //     return;
    // }
    @Response('user.sendOtp')
    @UserProtected()
    @AuthJwtAccessProtected()
    @Post('/phone/send-otp')
    async sendOtp(
        @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
        @Body() { mobileNumber }: UserSendOtpRequestDto
    ): Promise<void> {
        const phoneNumber = parsePhoneNumber(mobileNumber);
        if (!phoneNumber || !phoneNumber.isValid()) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_MOBILE_NUMBER_INVALID,
                message: 'user.error.mobileNumberInvalid',
            });
        }

        const formattedNumber = phoneNumber.number;

        const session: ClientSession = await this.databaseService.createTransaction();

        try {
            // Update user mobile number (unverified)
            await this.userService.updateMobileNumber(user, formattedNumber, { session });

            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Save to Cache
            await this.cacheManager.set(`otp:${user._id}`, otp, 300000); // 5 mins

            // Send via Telegram
            await this.telegramService.sendOtp(formattedNumber, otp);

            // Create Activity
            await this.activityService.createByUser(
                user,
                {
                    description: this.messageService.setMessage(
                        'activity.user.updateMobileNumber'
                    ),
                },
                { session }
            );

            await this.databaseService.commitTransaction(session);
        } catch (err) {
            await this.databaseService.abortTransaction(session);
            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @UserProtected()
    @AuthJwtAccessProtected()
    @Post('/phone/verify-otp')
    async verifyOtp(
        @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
        @Body() { code }: UserVerifyOtpRequestDto
    ): Promise<void> {
        const cachedOtp = await this.cacheManager.get(`otp:${user._id}`);

        if (!cachedOtp || cachedOtp !== code) {
            throw new BadRequestException({
                statusCode: ENUM_STATUS_CODE_ERROR.VERIFICATION_OTP_INVALID,
                message: 'user.error.otpInvalid',
            });
        }

        const session: ClientSession = await this.databaseService.createTransaction();

        try {
            await this.userService.updateVerificationMobileNumber(user, { session });

            await this.cacheManager.del(`otp:${user._id}`);

            await this.databaseService.commitTransaction(session);

            await this.emailQueue.add(ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED, {
                send: { email: user.email, name: user.firstName, lang: user.preferences.language },
                data: {
                    mobileNumber: user.mobileNumber
                }
            });
        } catch (err) {
            await this.databaseService.abortTransaction(session);
            throw new InternalServerErrorException({
                statusCode: ENUM_STATUS_CODE_ERROR.APP_UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }
}

import { ENUM_APP_STATUS_CODE_ERROR } from '@app/enums/app.status-code.enum';
import { DatabaseService } from '@common/database/services/database.service';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';
import {
    AuthJwtAccessProtected,
    AuthJwtPayload,
} from '@modules/auth/decorators/auth.jwt.decorator';
import { IAuthJwtAccessTokenPayload } from '@modules/auth/interfaces/auth.interface';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { UserProtected } from '@modules/users/decorators/user.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UsersService } from '@modules/users/services/users.service';
import { VerificationVerifyRequestDto } from '@modules/verification/dtos/request/verification.verify.request.dto';
import { VerificationResponse } from '@modules/verification/dtos/response/verification.response';
import { ENUM_VERIFICATION_STATUS_CODE_ERROR } from '@modules/verification/enums/verification.status-code.constant';
import {
    VerificationUserEmailNotVerifiedYetPipe,
    VerificationUserMobileNumberNotVerifiedYetPipe,
} from '@modules/verification/pipes/verification.user-not-verified-yet.pipe';
import { VerificationDoc } from '@modules/verification/repository/entity/verification.entity';
import { VerificationService } from '@modules/verification/services/verification.service';
import { InjectQueue } from '@nestjs/bullmq';
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { Queue } from 'bullmq';
import { ClientSession } from 'mongoose';

@ApiTags('modules.user.verification')
@Controller({
    version: '1',
    path: '/verification',
})
export class VerificationUserController {
    constructor(
        private readonly databaseService: DatabaseService,
        @InjectQueue(ENUM_WORKER_QUEUES.EMAIL_QUEUE)
        private readonly emailQueue: Queue,
        @InjectQueue(ENUM_WORKER_QUEUES.SMS_QUEUE)
        private readonly smsQueue: Queue,
        private readonly verificationService: VerificationService,
        private readonly userService: UsersService
    ) {}

    @Response('verification.getEmail')
    
    @UserProtected([false])
    @AuthJwtAccessProtected()
    
    @Get('/get/email')
    async getEmail(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user:UserDocument
    ): Promise<IResponse<VerificationResponse>> {
        const verification: VerificationDoc =
            await this.verificationService.findOneLatestEmailByUser(user._id.toString());
        if (!verification) {
            throw new NotFoundException({
                statusCode: ENUM_VERIFICATION_STATUS_CODE_ERROR.NOT_FOUND,
                message: 'verification.error.notFound',
            });
        }

        const mapped: VerificationResponse =
            this.verificationService.map(verification);

        return {
            data: mapped,
        };
    }

    @Response('verification.getMobileNumber')
    
    @UserProtected()
    @AuthJwtAccessProtected()
    
    @Get('/get/mobile-number')
    async getMobileNumber(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user:UserDocument
    ): Promise<IResponse<VerificationResponse>> {
        const verification: VerificationDoc =
            await this.verificationService.findOneLatestMobileNumberByUser(
                user._id.toString()
            );
        if (!verification) {
            throw new NotFoundException({
                statusCode: ENUM_VERIFICATION_STATUS_CODE_ERROR.NOT_FOUND,
                message: 'verification.error.notFound',
            });
        }

        const mapped: VerificationResponse =
            this.verificationService.map(verification);

        return {
            data: mapped,
        };
    }

    @Response('verification.resendEmail')
    
    @UserProtected([false])
    @AuthJwtAccessProtected()
    
    @Post('/resend/email')
    async resendEmail(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user:UserDocument
    ): Promise<IResponse<VerificationResponse>> {
        const latestVerification: VerificationDoc =
            await this.verificationService.findOneLatestEmailByUser(user._id.toString());
        if (latestVerification) {
            const mapped: VerificationResponse =
                this.verificationService.map(latestVerification);

            return {
                data: mapped,
            };
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.verificationService.inactiveEmailManyByUser(user._id.toString(), {
                session,
            });

            const verification: VerificationDoc =
                await this.verificationService.createEmailByUser(user, {
                    session,
                });

            await this.databaseService.commitTransaction(session);

            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.VERIFICATION,
                {
                    send: { email: user.email, name: user.firstName },
                    data: {
                        otp: verification.otp,
                        expiredAt: verification.expiredDate,
                        reference: verification.reference,
                    },
                },
                {
                    debounce: {
                        id: `${ENUM_SEND_EMAIL_PROCESS.VERIFICATION}-${user._id.toString()}`,
                        ttl: 1000,
                    },
                }
            );

            const mapped: VerificationResponse =
                this.verificationService.map(verification);

            return {
                data: mapped,
            };
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('verification.resendMobileNumber')
    
    @UserProtected()
    @AuthJwtAccessProtected()
    
    @Post('/resend/mobile-number')
    async resendMobileNumber(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>('user', UserParsePipe)
        user: UserDocument
    ): Promise<IResponse<VerificationResponse>> {
        const latestVerification: VerificationDoc =
            await this.verificationService.findOneLatestMobileNumberByUser(
                user._id.toString()
            );
        if (latestVerification) {
            const mapped: VerificationResponse =
                this.verificationService.map(latestVerification);

            return {
                data: mapped,
            };
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.verificationService.inactiveMobileNumberManyByUser(
                user._id.toString(),
                {
                    session,
                }
            );

            const verification: VerificationDoc =
                await this.verificationService.createMobileNumberByUser(user, {
                    session,
                });

            await this.databaseService.commitTransaction(session);

            // await this.smsQueue.add(
            //     ENUM_SEND_SMS_PROCESS.VERIFICATION,
            //     {
            //         send: { email: user.email, name: user.firstName },
            //         data: {
            //             otp: verification.otp,
            //             expiredAt: verification.expiredDate,
            //         },
            //     },
            //     {
            //         debounce: {
            //             id: `${ENUM_SEND_EMAIL_PROCESS.VERIFICATION}-${user._id.toString()}`,
            //             ttl: 1000,
            //         },
            //     }
            // );

            const mapped: VerificationResponse =
                this.verificationService.map(verification);

            return {
                data: mapped,
            };
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }

    @Response('verification.verifyEmail')
    
    @UserProtected([false])
    @AuthJwtAccessProtected()
    
    @HttpCode(HttpStatus.OK)
    @Post('/verify/email')
    async verifyEmail(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>(
            'user',
            UserParsePipe,
            VerificationUserEmailNotVerifiedYetPipe
        )
        user:UserDocument,
        @Body() { otp }: VerificationVerifyRequestDto
    ): Promise<void> {
        const verification: VerificationDoc =
            await this.verificationService.findOneLatestEmailByUser(user._id.toString());
        if (!verification) {
            throw new NotFoundException({
                statusCode: ENUM_VERIFICATION_STATUS_CODE_ERROR.NOT_FOUND,
                message: 'verification.error.notFound',
            });
        }

        const check: boolean = this.verificationService.validateOtp(
            verification,
            otp
        );
        if (!check) {
            throw new BadRequestException({
                statusCode: ENUM_VERIFICATION_STATUS_CODE_ERROR.OTP_NOT_MATCH,
                message: 'verification.error.otpNotMatch',
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.verificationService.verify(verification, {
                session,
            });
            await this.userService.updateVerificationEmail(user, {
                session,
            });

            await this.databaseService.commitTransaction(session);

            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.EMAIL_VERIFIED,
                {
                    send: { email: user.email, name: user.firstName },
                    data: {
                        reference: verification.reference,
                    },
                },
                {
                    debounce: {
                        id: `${ENUM_SEND_EMAIL_PROCESS.EMAIL_VERIFIED}-${user._id.toString()}`,
                        ttl: 1000,
                    },
                }
            );

            return;
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }
 
    @Response('verification.verifyMobileNumber')
    
    @UserProtected()
    @AuthJwtAccessProtected()
    
    @HttpCode(HttpStatus.OK)
    @Post('/verify/mobile-number')
    async verifyMobileNumber(
        @AuthJwtPayload<IAuthJwtAccessTokenPayload>(
            'user',
            UserParsePipe,
            VerificationUserMobileNumberNotVerifiedYetPipe
        )
        user:UserDocument,
        @Body() { otp }: VerificationVerifyRequestDto
    ): Promise<void> {
        const verification: VerificationDoc =
            await this.verificationService.findOneLatestMobileNumberByUser(
                user._id.toString()
            );
        if (!verification) {
            throw new NotFoundException({
                statusCode: ENUM_VERIFICATION_STATUS_CODE_ERROR.NOT_FOUND,
                message: 'verification.error.notFound',
            });
        }

        const check: boolean = this.verificationService.validateOtp(
            verification,
            otp
        );
        if (!check) {
            throw new BadRequestException({
                statusCode: ENUM_VERIFICATION_STATUS_CODE_ERROR.OTP_NOT_MATCH,
                message: 'verification.error.otpNotMatch',
            });
        }

        const session: ClientSession =
            await this.databaseService.createTransaction();

        try {
            await this.verificationService.verify(verification, {
                session,
            });
            await this.userService.updateVerificationMobileNumber(user, {
                session,
            });

            await this.databaseService.commitTransaction(session);

            await this.emailQueue.add(
                ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED,
                {
                    send: { email: user.email, name: user.firstName },
                    data: {
                        mobileNumber:
                            this.verificationService.map(verification).to,
                        reference: verification.reference,
                    },
                },
                {
                    debounce: {
                        id: `${ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED}-${user._id.toString()}`,
                        ttl: 1000,
                    },
                }
            );

            return;
        } catch (err: unknown) {
            await this.databaseService.abortTransaction(session);

            throw new InternalServerErrorException({
                statusCode: ENUM_APP_STATUS_CODE_ERROR.UNKNOWN,
                message: 'http.serverError.internalServerError',
                _error: err,
            });
        }
    }
}

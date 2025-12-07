import { Injectable, Logger } from '@nestjs/common';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { title } from 'case';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { EmailSendDto } from '@modules/email/dtos/email.send.dto';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { EmailTempPasswordDto } from '@modules/email/dtos/email.temp-password.dto';
import { EmailResetPasswordDto } from '@modules/email/dtos/email.reset-password.dto';
import { EmailCreateDto } from '@modules/email/dtos/email.create.dto';
import { EmailVerificationDto } from '@modules/email/dtos/email.verification.dto';
import { EmailVerifiedDto } from '@modules/email/dtos/email.verified.dto';
import { EmailMobileNumberVerifiedDto } from '@modules/email/dtos/email.mobile-number-verified.dto';
import { Resend } from 'resend';
@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    private readonly fromEmail: string;
    private readonly supportEmail: string;

    private readonly homeName: string;
    private readonly homeUrl: string;

    private readonly resendClient: Resend;

    constructor(
        private readonly helperDateService: HelperDateService,
        private readonly configService: ConfigService,
        private readonly httpService: HttpService
    ) {
        this.fromEmail = this.configService.get<string>('email.fromEmail');
        this.supportEmail =
            this.configService.get<string>('email.supportEmail');

        this.homeName = this.configService.get<string>('home.name');
        this.homeUrl = this.configService.get<string>('home.url');

        this.resendClient = new Resend(this.configService.get<string>('email.resendApiKey'));
    }

    async sendChangePassword({ name, email }: EmailSendDto): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                    },
                },

            });

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendWelcome({ name, email }: EmailSendDto): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.WELCOME,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        email: title(email),
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendCreate(
        { name, email }: EmailSendDto,
        { password: passwordString, passwordExpiredAt }: EmailCreateDto
    ): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.CREATE,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        password: passwordString,
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                        passwordExpiredAt:
                            this.helperDateService.formatToRFC2822(
                                passwordExpiredAt
                            ),
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendTempPassword(
        { name, email }: EmailSendDto,
        { password: passwordString, passwordExpiredAt }: EmailTempPasswordDto
    ): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.TEMPORARY_PASSWORD,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        password: passwordString,
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                        passwordExpiredAt:
                            this.helperDateService.formatToRFC2822(
                                passwordExpiredAt
                            ),
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendResetPassword(
        { name, email }: EmailSendDto,
        { expiredDate, url }: EmailResetPasswordDto
    ): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.RESET_PASSWORD,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                        expiredDate:
                            this.helperDateService.formatToRFC2822(expiredDate),
                        url,
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendVerification(
        { name, email }: EmailSendDto,
        { expiredAt, reference, otp }: EmailVerificationDto
    ): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.VERIFICATION,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                        expiredAt:
                            this.helperDateService.formatToRFC2822(expiredAt),
                        reference,
                        otp,
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendEmailVerified(
        { name, email }: EmailSendDto,
        { reference }: EmailVerifiedDto
    ): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.EMAIL_VERIFIED,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                        reference,
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async sendMobileNumberVerified(
        { name, email }: EmailSendDto,
        { reference, mobileNumber }: EmailMobileNumberVerifiedDto
    ): Promise<boolean> {
        try {
            await this.resendClient.emails.send({
                from: this.fromEmail,
                to: email,
                template: {
                    id: ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED,
                    variables: {
                        homeName: this.homeName,
                        name: title(name),
                        supportEmail: this.supportEmail,
                        homeUrl: this.homeUrl,
                        reference,
                        mobileNumber,
                    },
                },
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }
}

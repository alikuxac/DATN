import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { title } from 'case';

// DTOs
import { EmailSendDto } from '../dtos/email.send.dto';
import { EmailCreateDto } from '../dtos/email.create.dto';
import { EmailTempPasswordDto } from '../dtos/email.temp-password.dto';
// import { EmailResetPasswordDto } from '../dtos/email.reset-password.dto';
import { EmailVerificationDto } from '../dtos/email.verification.dto';
import { EmailVerifiedDto } from '../dtos/email.verified.dto';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { EmailResetPasswordDto } from '../dtos/email.reset-password.dto';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly fromEmail: string;
    private readonly supportEmail: string;

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        private readonly helperDateService: HelperDateService,
        private readonly i18n: I18nService,
    ) {
        this.fromEmail = this.configService.get<string>('email.fromEmail');
        this.supportEmail = this.configService.get<string>('email.supportEmail');
    }

    private async sendMail(
        to: string,
        subjectKey: string,
        templateName: string,
        context: Record<string, any>,
        lang?: string
    ): Promise<boolean> {
        try {
            const subject = await this.i18n.t(`mail.${subjectKey}`, { lang: 'en' });
            const templateFile = `${templateName}.en.template.hbs`;

            await this.mailerService.sendMail({
                to: to,
                from: this.fromEmail,
                subject: subject,
                template: templateFile,
                context: {
                    ...context,
                    supportEmail: this.supportEmail,
                },
            });

            return true;
        } catch (err) {
            this.logger.error(`Failed to send email ${templateName} to ${to}:`, err);
            return false;
        }
    }

    async sendChangePassword({ name, email, lang }: EmailSendDto): Promise<boolean> {
        return this.sendMail(
            email,
            'change_password_subject',
            'change-password',
            { name: title(name) },
            lang
        );
    }

    async sendWelcome({ name, email, lang }: EmailSendDto): Promise<boolean> {
        const nameParts = name.split(' ');
        const firstName = title(nameParts.pop() || '');
        const lastName = title(nameParts.join(' ') || '');

        return this.sendMail(
            email,
            'welcome_subject',
            'welcome',
            {
                firstName,
                lastName,
                email
            },
            lang
        );
    }

    async sendCreate(
        { name, email, lang }: EmailSendDto,
        { password, passwordExpiredAt }: EmailCreateDto
    ): Promise<boolean> {
        return this.sendMail(
            email,
            'account_created_subject',
            'create',
            {
                name: title(name),
                password,
                passwordExpiredAt: this.helperDateService.formatToRFC2822(passwordExpiredAt),
            },
            lang
        );
    }

    async sendTempPassword(
        { name, email, lang }: EmailSendDto,
        { password, passwordExpiredAt }: EmailTempPasswordDto
    ): Promise<boolean> {
        return this.sendMail(
            email,
            'temp_password_subject',
            'temp-password',
            {
                name: title(name),
                password,
                passwordExpiredAt: this.helperDateService.formatToRFC2822(passwordExpiredAt),
            },
            lang
        );
    }

    async sendResetPassword(
        { name, email, lang }: EmailSendDto,
        { password, expiredDate }: EmailResetPasswordDto // Giả định dùng chung cấu trúc mật khẩu mới
    ): Promise<boolean> {
        return this.sendMail(
            email,
            'reset_password_subject',
            'reset-password',
            {
                name: title(name),
                password,
                passwordExpiredAt: this.helperDateService.formatToRFC2822(expiredDate),
            },
            lang
        );
    }

    async sendVerification(
        { name, email, lang }: EmailSendDto,
        { expiredAt, reference, otp }: EmailVerificationDto
    ): Promise<boolean> {
        return this.sendMail(
            email,
            'verification_subject',
            'email-verification',
            {
                name: title(name),
                otp,
                reference,
                expiredAt: this.helperDateService.formatToRFC2822(expiredAt),
            },
            lang
        );
    }

    async sendEmailVerified(
        { name, email, lang }: EmailSendDto,
        { reference }: EmailVerifiedDto
    ): Promise<boolean> {
        return this.sendMail(
            email,
            'email_verified_subject',
            'email-verified',
            {
                name: title(name),
                reference,
            },
            lang
        );
    }
}
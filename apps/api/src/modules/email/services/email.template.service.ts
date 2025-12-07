import { Injectable, Logger } from '@nestjs/common';
import { ENUM_SEND_EMAIL_PROCESS } from '@modules/email/enums/email.enum';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailTemplateService {
    private readonly resend: Resend;
    private readonly logger = new Logger(EmailTemplateService.name);

    constructor(private readonly configService: ConfigService) {
        this.resend = new Resend(this.configService.get<string>('email.resendApiKey'));
    }

    async importChangePassword(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/change-password.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD,
                subject: `Change Password`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getChangePassword() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD}`);
    }

    async deleteChangePassword(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.CHANGE_PASSWORD);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importWelcome(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/welcome.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.WELCOME,
                subject: `Welcome`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getWelcome() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.WELCOME}`);
    }

    async deleteWelcome(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.WELCOME);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importCreate(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/create.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.CREATE,
                subject: `Create Account`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getCreate() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.CREATE}`);
    }

    async deleteCreate(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.CREATE);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importTempPassword(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/temp-password.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.TEMPORARY_PASSWORD,
                subject: `Temporary Password`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getTempPassword() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.TEMPORARY_PASSWORD}`);
    }

    async deleteTempPassword(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.TEMPORARY_PASSWORD);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importResetPassword(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/reset-password.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.RESET_PASSWORD,
                subject: `Reset Password`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getResetPassword() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.RESET_PASSWORD}`);
    }

    async deleteResetPassword(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.RESET_PASSWORD);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importVerification(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/email-verification.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.VERIFICATION,
                subject: `Email Verification`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getVerification() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.VERIFICATION}`);
    }

    async deleteVerification(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.VERIFICATION);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importEmailVerified(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/email-verified.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.EMAIL_VERIFIED,
                subject: `Email Verified`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getEmailVerified() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.EMAIL_VERIFIED}`);
    }

    async deleteEmailVerified(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.EMAIL_VERIFIED);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async importMobileNumberVerified(): Promise<boolean> {
        try {
            const templatePath = join(
                process.cwd(),
                'src/modules/email/templates/mobile-number-verified.template.hbs'
            );

            await this.resend.templates.create({
                name: ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED,
                subject: `Mobile Number Verified`,
                html: readFileSync(templatePath, 'utf8'),
            })

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }

    async getMobileNumberVerified() {
        return this.resend.post(`/templates/${ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED}`);
    }

    async deleteMobileNumberVerified(): Promise<boolean> {
        try {
            await this.resend.templates.remove(ENUM_SEND_EMAIL_PROCESS.MOBILE_NUMBER_VERIFIED);

            return true;
        } catch (err: unknown) {
            this.logger.error(err);

            return false;
        }
    }
}

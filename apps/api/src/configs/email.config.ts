import { registerAs } from '@nestjs/config';

export default registerAs(
    'email',
    (): Record<string, any> => ({
        fromEmail: process.env.EMAIL_FROM || 'noreply@mail.com',
        supportEmail: process.env.EMAIL_SUPPORT || 'support@mail.com',
        smtp: {
            host: process.env.EMAIL_SMTP_HOST,
            port: parseInt(process.env.EMAIL_SMTP_PORT, 10),
            secure: process.env.EMAIL_SMTP_SECURE === 'true',
            username: process.env.EMAIL_SMTP_USERNAME,
            password: process.env.EMAIL_SMTP_PASSWORD,
        },
    })
);

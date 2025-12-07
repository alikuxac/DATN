export class EmailVerificationDto {
    otp: string;

    expiredAt: Date;

    reference: string;
}

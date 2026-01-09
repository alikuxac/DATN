import { IResetPasswordVerifyRequest } from '@repo/shared';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordVerifyRequestDto implements IResetPasswordVerifyRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(12)
    @MinLength(12)
    otp: string;
}

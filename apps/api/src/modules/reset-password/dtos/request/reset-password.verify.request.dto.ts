import { IResetPasswordVerifyRequest } from '@repo/shared';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordVerifyRequestDto implements IResetPasswordVerifyRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(6)
    @MinLength(6)
    otp: string;
}

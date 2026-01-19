import { IResetPasswordVerifyRequest } from '@repo/shared';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordVerifyRequestDto implements IResetPasswordVerifyRequest {
    @IsString()
    @IsNotEmpty()
    @MaxLength(8)
    @MinLength(8)
    otp: string;
}

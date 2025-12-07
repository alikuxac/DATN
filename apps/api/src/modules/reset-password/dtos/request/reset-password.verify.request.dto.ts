import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordVerifyRequestDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(6)
    @MinLength(6)
    otp: string;
}

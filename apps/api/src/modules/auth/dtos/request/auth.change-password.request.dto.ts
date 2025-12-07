import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { IsPassword } from '@common/request/validations/request.is-password.validation';

export class AuthChangePasswordRequestDto {
    @IsNotEmpty()
    @IsString()
    @IsPassword()
    @MinLength(8)
    @MaxLength(50)
    newPassword: string;

    @IsString()
    @IsNotEmpty()
    oldPassword: string;
}

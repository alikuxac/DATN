import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsPassword } from '@common/request/validations/request.is-password.validation';
import { ISignUpPayload } from '@repo/shared';

export class AuthSignUpRequestDto implements ISignUpPayload {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsPassword()
    @MinLength(8)
    @MaxLength(50)
    password: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    lastName: string;
}

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ILoginPayload } from '@repo/shared/interfaces'

export class AuthLoginRequestDto implements ILoginPayload {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

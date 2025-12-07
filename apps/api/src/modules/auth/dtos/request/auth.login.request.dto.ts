import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthLoginRequestDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

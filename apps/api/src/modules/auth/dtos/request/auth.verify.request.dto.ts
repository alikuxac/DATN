import { IsString, IsEmail, IsNotEmpty } from "class-validator";

export class AuthVerifyRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
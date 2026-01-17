import { ENUM_USER_GENDER } from '@repo/shared';
import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber, IsEnum, IsOptional } from 'class-validator';
import { IUserCreateRequest } from '@repo/shared';
export class UserCreateRequestDto implements IUserCreateRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsEnum(ENUM_USER_GENDER)
  gender: ENUM_USER_GENDER;

  @IsOptional()
  @IsPhoneNumber()
  mobileNumber: string;
}

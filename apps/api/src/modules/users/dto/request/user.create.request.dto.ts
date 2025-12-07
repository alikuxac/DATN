import { ENUM_USER_GENDER } from '@modules/users/enums/user.enum';
import { IsEmail, IsNotEmpty, IsString, IsPhoneNumber, IsEnum } from 'class-validator';

export class UserCreateRequestDto {
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

  @IsPhoneNumber()
  phoneNumber: string;
}

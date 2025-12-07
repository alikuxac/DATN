import { PartialType } from '@nestjs/mapped-types';
import { UserCreateRequestDto } from './request/user.create.request.dto';
import { ENUM_USER_GENDER } from '../enums/user.enum';
import { IsEnum } from 'class-validator';

export class UserUpdateRequestDto extends PartialType(UserCreateRequestDto) {
  @IsEnum(ENUM_USER_GENDER)
  gender: ENUM_USER_GENDER;
}

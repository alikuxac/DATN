import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ENUM_USER_ROLE } from '@repo/shared';

export class UserUpdateRoleRequestDto {
  @ApiProperty({
    required: true,
    enum: ENUM_USER_ROLE,
    default: ENUM_USER_ROLE.USER,
  })
  @IsString()
  @IsEnum(ENUM_USER_ROLE)
  @IsNotEmpty()
  role: ENUM_USER_ROLE;
}

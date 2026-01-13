import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UserSendOtpRequestDto {
  @ApiProperty({
    example: '+84901234567',
    required: true,
    maxLength: 20,
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  mobileNumber: string;
}

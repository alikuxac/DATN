import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UserVerifyOtpRequestDto {
  @ApiProperty({
    required: true,
    example: '123456',
    description: 'OTP Code sent to Telegram',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UserUpdateMobileNumberRequestDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(22)
    number: string;
}

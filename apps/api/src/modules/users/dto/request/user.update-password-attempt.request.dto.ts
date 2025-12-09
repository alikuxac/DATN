import { ApiProperty } from '@nestjs/swagger';
import { IUserUpdatePasswordAttemptRequest } from '@repo/shared';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class UserUpdatePasswordAttemptRequestDto implements IUserUpdatePasswordAttemptRequest{
    @ApiProperty({
        required: true,
        minimum: 0,
        maximum: 3,
    })
    @IsNumber({ allowNaN: false, allowInfinity: false })
    @IsNotEmpty()
    @Min(0)
    @Max(3)
    passwordAttempts: number;
}

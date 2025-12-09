import { ApiProperty } from '@nestjs/swagger';
import { IVerificationResponse } from '@repo/shared';
import { Type } from 'class-transformer';

export class VerificationResponse implements IVerificationResponse {
    @ApiProperty({
        required: true,
        description: 'timestamp in minutes',
    })
    expiredIn: number;

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    to: string;
}

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IActivityCreateRequest, ENUM_ACTIVITY_TYPE } from '@repo/shared';

export class ActivityCreateResponse implements IActivityCreateRequest {
    @IsNotEmpty()
    @IsEnum(ENUM_ACTIVITY_TYPE)
    type: ENUM_ACTIVITY_TYPE;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    properties?: Record<string, any>;
}

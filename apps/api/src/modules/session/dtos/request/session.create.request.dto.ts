import { ISessionCreateRequest, ENUM_SESSION_PLATFORM } from '@repo/shared';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SessionCreateRequestDto implements ISessionCreateRequest {
    @IsNotEmpty()
    @IsUUID()
    user: string;

    @IsNotEmpty()
    @IsEnum(ENUM_SESSION_PLATFORM)
    platform: ENUM_SESSION_PLATFORM;

    @IsOptional()
    @IsString()
    deviceId?: string;

    @IsOptional()
    @IsString()
    deviceName?: string;
}

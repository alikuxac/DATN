import { ISessionCreateRequest } from '@repo/shared';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SessionCreateRequestDto implements ISessionCreateRequest{
    @IsNotEmpty()
    @IsUUID()
    user: string;
}

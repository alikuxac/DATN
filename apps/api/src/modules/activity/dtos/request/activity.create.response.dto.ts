import { IsNotEmpty, IsString } from 'class-validator';
import { IActivityCreateRequest } from '@repo/shared';
export class ActivityCreateResponse implements IActivityCreateRequest {
    @IsNotEmpty()
    @IsString()
    description: string;
}

import { Type } from 'class-transformer';
import { DatabaseUUIDDto } from '@common/database/dtos/database.uuid.dto';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';
import { IActivityListResponse } from '@repo/shared';

export class ActivityListResponseDto extends DatabaseUUIDDto implements IActivityListResponse {
    user: string;

    description: string;

    @Type(() => UserShortResponseDto)
    by: UserShortResponseDto;
}

import { OmitType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { ENUM_USER_STATUS, IUserShortResponse } from '@repo/shared';
import { UserListResponseDto } from '@modules/users/dto/response/user.list.response.dto';

export class UserShortResponseDto extends OmitType(UserListResponseDto, [
    'status',
    'createdAt',
    'updatedAt',
]) implements IUserShortResponse {
    status: ENUM_USER_STATUS;

    @Exclude()
    createdAt: Date;

    @Exclude()
    updatedAt: Date;
}

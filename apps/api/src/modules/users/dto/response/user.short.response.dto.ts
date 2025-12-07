import { OmitType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

import { ENUM_USER_STATUS } from '@modules/users/enums/user.enum';
import { UserListResponseDto } from '@modules/users/dto/response/user.list.response.dto';

export class UserShortResponseDto extends OmitType(UserListResponseDto, [
    'status',
    'createdAt',
    'updatedAt',
]) {
    status: ENUM_USER_STATUS;

    @Exclude()
    createdAt: Date;

    @Exclude()
    updatedAt: Date;
}

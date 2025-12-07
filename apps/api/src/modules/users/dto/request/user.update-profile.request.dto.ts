import { PickType } from '@nestjs/swagger';
import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';

export class UserUpdateProfileRequestDto extends PickType(
    UserCreateRequestDto,
    ['firstName', 'lastName', 'gender'] as const
) {}

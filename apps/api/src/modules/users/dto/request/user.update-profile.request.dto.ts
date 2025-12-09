import { PickType } from '@nestjs/swagger';
import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';
import { IUserUpdateProfileRequest } from '@repo/shared';

export class UserUpdateProfileRequestDto extends PickType(
    UserCreateRequestDto,
    ['firstName', 'lastName', 'gender'] as const
) implements IUserUpdateProfileRequest {}

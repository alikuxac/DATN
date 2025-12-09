import { OmitType } from '@nestjs/swagger';
import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';
import { IUserUpdateRequest } from '@repo/shared';
export class UserUpdateRequestDto extends OmitType(UserCreateRequestDto, [
    'email',
] as const) implements IUserUpdateRequest {}

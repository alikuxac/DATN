import { PickType } from '@nestjs/swagger';
import { UserCreateRequestDto } from '@modules/users/dto/request/user.create.request.dto';
import { UserUpdateClaimUsernameRequestDto } from '@modules/users/dto/request/user.update-claim-username.request.dto';

export class UserCheckUsernameRequestDto extends UserUpdateClaimUsernameRequestDto {}

export class UserCheckEmailRequestDto extends PickType(UserCreateRequestDto, [
    'email',
] as const) {}

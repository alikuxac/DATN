import { OmitType } from '@nestjs/swagger';


import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';
import { IUserProfileReponse } from '@repo/shared';

export class UserProfileResponseDto extends OmitType(UserGetResponseDto, [
    'role',
    'mobileNumber',
] as const) implements IUserProfileReponse {}

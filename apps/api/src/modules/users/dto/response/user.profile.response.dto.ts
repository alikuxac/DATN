import { OmitType } from '@nestjs/swagger';


import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';

export class UserProfileResponseDto extends OmitType(UserGetResponseDto, [
    'role',
    'mobileNumber',
] as const) {}

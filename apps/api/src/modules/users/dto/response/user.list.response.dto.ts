import {
    OmitType,
} from '@nestjs/swagger';
import {
    ENUM_USER_GENDER,
    ENUM_USER_SIGN_UP_FROM,
    IUserListResponse,
} from '@repo/shared';

import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';
import { UserVerificationResponseDto } from '@modules/users/dto/response/user.verification.response.dto';

export class UserListResponseDto extends OmitType(UserGetResponseDto, [
    'passwordExpiredAt',
    'passwordCreatedAt',
    'signUpDate',
    'signUpFrom',
    'gender',
    'verification',
] as const) implements IUserListResponse {
    passwordExpiredAt: Date;
    passwordCreatedAt: Date;
    signUpDate: Date;
    signUpFrom: ENUM_USER_SIGN_UP_FROM;
    gender?: ENUM_USER_GENDER;
    verification: UserVerificationResponseDto;
}

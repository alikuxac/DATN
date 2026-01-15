import {
  ENUM_USER_GENDER,
  ENUM_USER_ROLE,
  ENUM_USER_SIGN_UP_FROM,
  ENUM_USER_STATUS,
  IUserGetResponse,
} from '@repo/shared';
import { UserVerificationResponseDto } from '@modules/users/dto/response/user.verification.response.dto';
import { DatabaseObjectIdDto } from '@common/database/dtos/database.object-id.dto';
import { Exclude } from 'class-transformer';
import { UserPreferencesResponseDto } from './user.preference.response.dto';
import { UserSettingsResponseDto } from './user.settings.response.dto';

export class UserGetResponseDto extends DatabaseObjectIdDto implements IUserGetResponse {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  role: ENUM_USER_ROLE;

  @Exclude()
  password: string;
  @Exclude()
  passwordExpiredAt: Date;
  @Exclude()
  passwordCreatedAt: Date;
  @Exclude()
  passwordAttempts: number;

  isRescueMode: boolean;

  signUpDate: Date;
  signUpFrom: ENUM_USER_SIGN_UP_FROM;
  status: ENUM_USER_STATUS;
  gender: ENUM_USER_GENDER;

  location?: { type: string; coordinates: number[] };
  lastLocationAt?: Date;

  avatar?: string;

  verification: UserVerificationResponseDto;
  preferences: UserPreferencesResponseDto;
  settings: UserSettingsResponseDto;
}


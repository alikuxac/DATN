import { 
  ENUM_USER_ROLE, 
  ENUM_USER_SIGN_UP_FROM, 
  ENUM_USER_STATUS, 
  ENUM_USER_GENDER,
  ENUM_MESSAGE_LANGUAGE
} from '@repo/shared';

import { UserVerificationEntity, UserVerificationSchema } from './user.verification.entity';
import { DatabaseProp, DatabaseEntity, DatabaseSchema,  } from '@common/database/decorators/database.decorator';
import { IDatabaseDocument } from '@common/database/interfaces/database.interface';
import { DatabaseObjectIdEntityBase } from '@common/database/bases/database.object-id.entity';

@DatabaseEntity({
  collection: 'users',
})
export class UserEntity extends DatabaseObjectIdEntityBase {
  @DatabaseProp({
    required: true,
    unique: true,
    index: true,
    trim: true,
    type: String,
    maxlength: 100,
  })
  email: string;

  @DatabaseProp({ trim: true, default: '' })
  lastName: string;

  @DatabaseProp({ trim: true, default: '' })
  firstName: string;

  @DatabaseProp({ enum: ENUM_USER_GENDER, type: String, default: ENUM_USER_GENDER.OTHER })
  gender: ENUM_USER_GENDER;

  @DatabaseProp({ type: String, trim: true, required: true })
  password: string;

  @DatabaseProp()
  passwordExpiredAt: Date;w

  @DatabaseProp()
  passwordCreatedAt: Date;

  @DatabaseProp({ default: 0, type: Number, required: true, min: 0 })
  passwordAttempts: number;

  @DatabaseProp({ default: false })
  isVolunteer: boolean;

  @DatabaseProp({ default: false })
  isVerified: boolean;

  @DatabaseProp({ type: Date, trim: true, required: true })
  signUpDate: Date;

  @DatabaseProp({ enum: ENUM_USER_SIGN_UP_FROM, required: true, type: String })
  signUpFrom: ENUM_USER_SIGN_UP_FROM;

  @DatabaseProp({
    required: true,
    default: ENUM_USER_STATUS.ACTIVE,
    index: true,
    type: String,
    enum: ENUM_USER_STATUS,
  })
  status: ENUM_USER_STATUS;

  @DatabaseProp({ default: ENUM_USER_ROLE.USER, enum: ENUM_USER_ROLE })
  role: ENUM_USER_ROLE;

  @DatabaseProp({ enum: ENUM_MESSAGE_LANGUAGE, default: ENUM_MESSAGE_LANGUAGE.VI })
  language: ENUM_MESSAGE_LANGUAGE;

  @DatabaseProp()
  mobileNumber: string;

  @DatabaseProp({ required: true, schema: UserVerificationSchema })
  verification: UserVerificationEntity;
}

export const UserSchema = DatabaseSchema(UserEntity);
export type UserDocument = IDatabaseDocument<UserEntity>;
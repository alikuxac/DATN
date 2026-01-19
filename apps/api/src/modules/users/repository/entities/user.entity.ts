import {
  ENUM_USER_ROLE,
  ENUM_USER_SIGN_UP_FROM,
  ENUM_USER_STATUS,
  ENUM_USER_GENDER
} from '@repo/shared';

import { UserVerificationEntity, UserVerificationSchema } from './user.verification.entity';
import { DatabaseProp, DatabaseEntity, DatabaseSchema, } from '@common/database/decorators/database.decorator';
import { IDatabaseDocument } from '@common/database/interfaces/database.interface';
import { DatabaseObjectIdEntityBase } from '@common/database/bases/database.object-id.entity';
import { UserPreferencesEntity, UserPreferencesSchema } from './user.preferences.entity';
import { NotificationSettingsEntity, NotificationSettingsSchema } from './user.settings.entity';

@DatabaseEntity({
  collection: 'users',
  timestamps: true,
  versionKey: false,
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
  passwordExpiredAt: Date;

  @DatabaseProp()
  passwordCreatedAt: Date;

  @DatabaseProp({ default: 0, type: Number, required: true, min: 0 })
  passwordAttempts: number;

  @DatabaseProp({ default: false })
  isRescueMode: boolean;

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

  @DatabaseProp()
  mobileNumber: string;

  @DatabaseProp()
  expoPushToken?: string;

  @DatabaseProp({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }, // [Lng, Lat]
  })
  location?: { type: string; coordinates: number[] };

  @DatabaseProp({ type: Date })
  lastLocationAt?: Date;

  @DatabaseProp({ type: String, trim: true })
  avatar?: string;


  @DatabaseProp({ required: true, schema: UserVerificationSchema })
  verification: UserVerificationEntity;

  @DatabaseProp({ required: true, schema: UserPreferencesSchema })
  preferences: UserPreferencesEntity;

  @DatabaseProp({ _id: false, required: true, schema: NotificationSettingsSchema })
  settings: NotificationSettingsEntity
}

export const UserSchema = DatabaseSchema(UserEntity);
UserSchema.index({ location: '2dsphere' });

export type UserDocument = IDatabaseDocument<UserEntity>;
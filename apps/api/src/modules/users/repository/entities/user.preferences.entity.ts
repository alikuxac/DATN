import { DatabaseSchema, DatabaseProp, DatabaseEntity } from "@common/database/decorators/database.decorator";
import { IDatabaseDocument } from "@common/database/interfaces/database.interface";

import { ENUM_USER_THEME, ENUM_MESSAGE_LANGUAGE } from '@repo/shared';

@DatabaseEntity({ _id: false, timestamps: false })
export class UserPreferencesEntity {
  @DatabaseProp({ enum: ENUM_MESSAGE_LANGUAGE, type: String, default: ENUM_MESSAGE_LANGUAGE.EN })
  language: ENUM_MESSAGE_LANGUAGE;

  @DatabaseProp({ enum: ENUM_USER_THEME, type: String, default: ENUM_USER_THEME.SYSTEM })
  theme: ENUM_USER_THEME;
}

export const UserPreferencesSchema = DatabaseSchema(UserPreferencesEntity);
export type UserPreferencesDocument = IDatabaseDocument<UserPreferencesEntity>;
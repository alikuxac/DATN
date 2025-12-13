import { ENUM_MESSAGE_LANGUAGE, ENUM_USER_THEME, IUserPreferencesResponse } from '@repo/shared';

export class UserPreferencesResponseDto implements IUserPreferencesResponse {
  language: ENUM_MESSAGE_LANGUAGE;
  theme: ENUM_USER_THEME;
}
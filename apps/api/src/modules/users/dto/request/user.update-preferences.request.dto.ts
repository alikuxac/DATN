import { IsEnum, IsOptional } from "class-validator";

import { ENUM_MESSAGE_LANGUAGE, ENUM_USER_THEME } from "@repo/shared";

export class UserUpdatePreferencesRequestDto {
  @IsEnum(ENUM_USER_THEME)
  @IsOptional()
  theme?: ENUM_USER_THEME;

  @IsEnum(ENUM_MESSAGE_LANGUAGE)
  @IsOptional()
  language?: ENUM_MESSAGE_LANGUAGE;
}
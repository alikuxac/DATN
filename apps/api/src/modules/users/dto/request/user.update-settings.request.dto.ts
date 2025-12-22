import { IsBoolean, IsOptional } from "class-validator";

export class UserUpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  sosAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  activityUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  newsLetters?: boolean;

  // ... các trường khác
}
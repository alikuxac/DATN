import { ENUM_REPORT_SEVERITY, ENUM_REPORT_TYPE } from "@repo/shared";
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateGuestReportDto {
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsEnum(ENUM_REPORT_TYPE)
  type: ENUM_REPORT_TYPE;

  @IsOptional()
  @IsEnum(ENUM_REPORT_SEVERITY)
  severity?: ENUM_REPORT_SEVERITY;

  @IsNotEmpty()
  @IsString()
  regionId: string;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

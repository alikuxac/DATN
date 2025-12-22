import { ENUM_REPORT_TYPE } from '@repo/shared';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ReportListRequestDto {
  @IsOptional()
  @IsString()
  regionId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsEnum(ENUM_REPORT_TYPE)
  @IsOptional()
  type?: ENUM_REPORT_TYPE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  timeRange?: number;
}
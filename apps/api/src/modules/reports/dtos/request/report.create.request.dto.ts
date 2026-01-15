import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_TYPE, IReportCreateRequest } from '@repo/shared';

export class ReportCreateRequestDto implements IReportCreateRequest {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsNotEmpty()
  coordinates: number[]; // [longitude, latitude]

  @IsEnum(ENUM_REPORT_TYPE)
  @IsNotEmpty()
  type: ENUM_REPORT_TYPE;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(ENUM_REPORT_SEVERITY)
  @IsOptional()
  severity?: ENUM_REPORT_SEVERITY;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  peopleCount?: number;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsNotEmpty()
  regionId: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  @IsOptional()
  images?: string[];
}
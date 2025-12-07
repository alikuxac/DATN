import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ENUM_REPORT_SEVERITY } from '@modules/reports/enums/report.enum';

export class ReportCreateRequestDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsNotEmpty()
  coordinates: number[]; // [longitude, latitude]

  @IsString()
  @IsNotEmpty()
  address: string;

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
}
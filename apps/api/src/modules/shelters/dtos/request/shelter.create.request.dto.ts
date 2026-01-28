import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
  IsBoolean
} from 'class-validator';
import { ENUM_SHELTER_TYPE, ENUM_SHELTER_STATUS, ENUM_REPORT_LOCATION_TYPE } from '@repo/shared';

class LocationDto {
  @IsEnum(ENUM_REPORT_LOCATION_TYPE)
  @IsNotEmpty()
  type: string = ENUM_REPORT_LOCATION_TYPE.POINT;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

class ResourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsString()
  @IsOptional()
  category?: string;
}

class FacilitiesDto {
  @IsBoolean()
  @IsOptional()
  electricity?: boolean;

  @IsBoolean()
  @IsOptional()
  water?: boolean;

  @IsBoolean()
  @IsOptional()
  medical?: boolean;

  @IsBoolean()
  @IsOptional()
  kitchen?: boolean;

  @IsBoolean()
  @IsOptional()
  restroom?: boolean;
}

export class ShelterCreateRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ENUM_SHELTER_TYPE)
  @IsNotEmpty()
  type: ENUM_SHELTER_TYPE;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  regionId: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  capacity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentOccupancy?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResourceDto)
  @IsOptional()
  resources?: ResourceDto[];

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ValidateNested()
  @Type(() => FacilitiesDto)
  @IsOptional()
  facilities?: FacilitiesDto;
}

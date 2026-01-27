import { PartialType } from '@nestjs/mapped-types';
import { ShelterCreateRequestDto } from './shelter.create.request.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ENUM_SHELTER_STATUS } from '@repo/shared';

export class ShelterUpdateRequestDto extends PartialType(ShelterCreateRequestDto) {
  @IsEnum(ENUM_SHELTER_STATUS)
  @IsOptional()
  status?: ENUM_SHELTER_STATUS;
}

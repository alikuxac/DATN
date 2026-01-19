import { Exclude, Expose, Type } from 'class-transformer';
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS, ENUM_REPORT_TYPE, ENUM_REPORT_SOURCE } from '@repo/shared';
import { DatabaseObjectIdDto } from '@common/database/dtos/database.object-id.dto';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';

@Exclude()
export class ReportListResponseDto extends DatabaseObjectIdDto {
  @Expose()
  @Type(() => UserShortResponseDto)
  user: UserShortResponseDto;

  @Expose()
  @Type(() => UserShortResponseDto)
  by: UserShortResponseDto;

  @Expose()
  @Type(() => UserShortResponseDto)
  rescuer: UserShortResponseDto;

  @Expose()
  @Type(() => Object)
  location: {
    type: string;
    coordinates: number[];
  };

  @Expose()
  address: string;

  @Expose()
  notes: string;

  @Expose()
  severity: ENUM_REPORT_SEVERITY;

  @Expose()
  type: ENUM_REPORT_TYPE;

  @Expose()
  status: ENUM_REPORT_STATUS;

  @Expose()
  peopleCount: number;

  @Expose()
  isPublic: boolean;

  @Expose()
  images: string[];

  @Expose()
  rejectReason?: string;

  @Expose()
  source: ENUM_REPORT_SOURCE;

  @Expose()
  isProxyReport: boolean;

  @Expose()
  proxyData?: {
    victimName: string;
    victimCount: number;
    victimNote: string;
  };
}
import { Exclude, Expose, Type } from 'class-transformer';
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS } from '@repo/shared';
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
  status: ENUM_REPORT_STATUS;

  @Expose()
  peopleCount: number;

  @Expose()
  isPublic: boolean;
}
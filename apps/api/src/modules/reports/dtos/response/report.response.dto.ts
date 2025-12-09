import { Exclude, Expose, Type } from 'class-transformer';
import { DatabaseObjectIdDto } from '@common/database/dtos/database.object-id.dto';
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS } from '@repo/shared';

@Exclude()
export class ReportResponseDto extends DatabaseObjectIdDto {
  @Expose()
  userId: string;

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
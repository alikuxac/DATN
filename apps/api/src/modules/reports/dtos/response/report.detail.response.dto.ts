import { Exclude, Expose, Type } from 'class-transformer';
import { ReportListResponseDto } from './report.list.reponse.dto';
import { ENUM_REPORT_TYPE } from '@repo/shared';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';

@Exclude()
export class ReportDetailResponseDto extends ReportListResponseDto {
  @Expose()
  type: ENUM_REPORT_TYPE;

  @Expose()
  regionId: string;

  @Expose()
  images: string[];

  @Expose()
  get description(): string {
    return this.notes;
  }
}

import { HelperDateService } from '@common/helper/services/helper.date.service';
import { Injectable, mixin, Scope, Type } from '@nestjs/common';
import { PipeTransform } from '@nestjs/common';

export function PaginationFilterDateTimeRangePipe(

): Type<PipeTransform> {
  @Injectable({ scope: Scope.REQUEST})
  class MixinPaginationFilterDateTimeRangePipe implements PipeTransform {
    constructor(
      private readonly helperDateService: HelperDateService
    ) {}
    transform(value: string) {
      if (!value) return undefined;

      const hours = parseInt(value);

      if (isNaN(hours) || hours <= 0) {
        return undefined;
      }

      // Logic: Lấy thời điểm hiện tại trừ đi số giờ
      const dateThreshold = this.helperDateService.create();
      dateThreshold.setHours(dateThreshold.getHours() - hours);

      // Trả về Query Mongo: Lớn hơn hoặc bằng thời điểm đó
      return { $gte: dateThreshold };
    }
  }

  return mixin(MixinPaginationFilterDateTimeRangePipe);
}
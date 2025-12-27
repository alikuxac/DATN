import { Inject, Injectable, mixin, Type } from "@nestjs/common";
import { PipeTransform, Scope } from "@nestjs/common/interfaces";
import { REQUEST } from "@nestjs/core";
import { DatabaseService } from "@common/database/services/database.service";
import { IRequestApp } from "@common/request/interfaces/request.interface";
import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS } from '@repo/shared';
import { IPaginationFilterDateOptions } from "../interfaces/pagination.interface";
import { HelperDateService } from "@common/helper/services/helper.date.service";

export function PaginationFilterDatePipe(
  options: IPaginationFilterDateOptions
): Type<PipeTransform> {
  @Injectable({ scope: Scope.REQUEST })
  class MixinPaginationFilterDatePipe implements PipeTransform {
    constructor(
      @Inject(REQUEST) protected readonly request: IRequestApp,
      private readonly databaseService: DatabaseService,
      private readonly helperDateService: HelperDateService
    ) { }

    transform(value: string) {
      if (!value) return undefined;

      const date = this.helperDateService.create(value);

      if (isNaN(date.getTime())) return undefined;

      const option = options.time || ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.EQUAL;

      // Reset giờ về đầu ngày (00:00:00.000)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // Tính cuối ngày (23:59:59.999)
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      switch (option) {
        case ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.GREATER_THAN_EQUAL:
          return { $gte: startOfDay };

        // 2. Trước ngày X (Tính đến hết ngày X)
        case ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.LESS_THAN_EQUAL:
          return { $lte: endOfDay };

        // 3. Chính xác ngày X (Trong khoảng 24h của ngày đó)
        case ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS.EQUAL:
        default:
          return {
            $gte: startOfDay,
            $lte: endOfDay
          };
      }
    }
  }

  return mixin(MixinPaginationFilterDatePipe);
}
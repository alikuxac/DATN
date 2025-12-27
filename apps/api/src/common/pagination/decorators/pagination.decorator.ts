import { PaginationFilterInPipe } from '@common/pagination/pipes/pagination.filter-in.pipe';
import { Query } from '@nestjs/common';
import {
  IPaginationFilterDateBetweenOptions,
  IPaginationFilterEqualOptions,
  IPaginationFilterOptions,
  IPaginationQueryOptions,
} from '@common/pagination/interfaces/pagination.interface';
import { PaginationFilterDatePipe } from '@common/pagination/pipes/pagination.filter-date.pipe';
import { PaginationFilterDateTimeRangePipe } from '@common/pagination/pipes/pagination.filter-date-time-range.pipe';
import { PaginationFilterDateBetweenPipe } from '@common/pagination/pipes/pagination.filter-date-between.pipe';
import { PaginationFilterEqualPipe } from '@common/pagination/pipes/pagination.filter-equal.pipe';
import { PaginationFilterInBooleanPipe } from '@common/pagination/pipes/pagination.filter-in-boolean.pipe';
import { PaginationFilterInEnumPipe } from '@common/pagination/pipes/pagination.filter-in-enum.pipe';
import { PaginationFilterStringContainPipe } from '@common/pagination/pipes/pagination.filter-string-contain.pipe';
import { PaginationOrderPipe } from '@common/pagination/pipes/pagination.order.pipe';
import { PaginationPagingPipe } from '@common/pagination/pipes/pagination.paging.pipe';
import { PaginationSearchPipe } from '@common/pagination/pipes/pagination.search.pipe';
import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS } from '@repo/shared';

export function PaginationQuery(
  options?: IPaginationQueryOptions
): ParameterDecorator {
  return Query(
    PaginationSearchPipe(options?.availableSearch),
    PaginationPagingPipe(options?.defaultPerPage),
    PaginationOrderPipe(
      options?.defaultOrderBy,
      options?.defaultOrderDirection,
      options?.availableOrderBy
    )
  );
}

export function PaginationQueryFilterInBoolean(
  field: string,
  defaultValue: boolean[],
  options?: IPaginationFilterOptions
): ParameterDecorator {
  return Query(
    options?.queryField ?? field,
    PaginationFilterInBooleanPipe(field, defaultValue, options)
  );
}

export function PaginationQueryFilterInEnum<T>(
  field: string,
  defaultValue: T,
  defaultEnum: Record<string, any>,
  options?: IPaginationFilterOptions
): ParameterDecorator {
  return Query(
    options?.queryField ?? field,
    PaginationFilterInEnumPipe<T>(field, defaultValue, defaultEnum, options)
  );
}

export function PaginationQueryFilterIn<T>(
  field: string,
  options?: IPaginationFilterOptions
): ParameterDecorator {
  return Query(
    options?.queryField ?? field,
    PaginationFilterInPipe<T>(field, options)
  );
}

export function PaginationQueryFilterEqual(
  field: string,
  options?: IPaginationFilterEqualOptions
): ParameterDecorator {
  return Query(
    options?.queryField ?? field,
    PaginationFilterEqualPipe(field, options)
  );
}

export function PaginationQueryFilterStringContain(
  field: string,
  options?: IPaginationFilterOptions
): ParameterDecorator {
  return Query(
    options?.queryField ?? field,
    PaginationFilterStringContainPipe(field, options)
  );
}

export function PaginationQueryFilterDateBetween(
  fieldStart: string,
  fieldEnd: string,
  options?: IPaginationFilterDateBetweenOptions
): ParameterDecorator {
  return Query(
    PaginationFilterDateBetweenPipe(fieldStart, fieldEnd, options)
  );
}

export function PaginationQueryFilterDate(
  field: string,
  options?: ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS
): ParameterDecorator {
  return Query(
    field,
    PaginationFilterDatePipe({ time: options })
  )
}

export function PaginationQueryFilterDateTimeRange(
  field: string,
): ParameterDecorator {
  return Query(
    field,
    PaginationFilterDateTimeRangePipe()
  )
}
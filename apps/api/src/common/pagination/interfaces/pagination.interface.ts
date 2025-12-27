import { ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS, ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from '@repo/shared';

export type IPaginationOrder = Record<
  string,
  ENUM_PAGINATION_ORDER_DIRECTION_TYPE
>;

export interface IPaginationQueryOptions {
  defaultPerPage?: number;
  defaultOrderBy?: string;
  defaultOrderDirection?: ENUM_PAGINATION_ORDER_DIRECTION_TYPE;
  availableSearch?: string[];
  availableOrderBy?: string[];
}

export interface IPaginationFilterOptions {
  queryField?: string;
  raw?: boolean;
}

export interface IPaginationFilterDateBetweenOptions {
  queryFieldStart?: string;
  queryFieldEnd?: string;
}

export interface IPaginationFilterEqualOptions
  extends IPaginationFilterOptions {
  isNumber?: boolean;
}

export interface IPaginationFilterDateOptions {
  time?: ENUM_PAGINATION_FILTER_DATE_TIME_OPTIONS;
}

export interface IDateFilterParams {
  dateField?: string;      // Tên trường muốn filter (do client gửi)
  timeRange?: Date;        // Khoảng thời gian tương đối
  fromDate?: Date;         // Từ ngày
  toDate?: Date;           // Đến ngày
  exactDate?: Date;        // Chính xác ngày
}
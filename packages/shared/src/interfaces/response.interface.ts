import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from "../enums";

export interface IResponseMetadata {
  timestamp: number;
  timezone: string;
  path: string;
  [key: string]: any
}

export interface IResponsePagingMetadataPaginationRequest {
  search: string;

  filters: Record<
    string,
    string | number | boolean | Array<string | number | boolean> | Date
  >;

  page: number;

  perPage: number;

  orderBy: string;

  orderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE;

  availableSearch: string[];

  availableOrderBy: string[];

  availableOrderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE[];

  total?: number;

  totalPage?: number;
}

export interface IResponsePagingMetadata extends IResponseMetadata {
  pagination?: IResponsePagingMetadataPaginationRequest;
}

export interface IResponse<T> {
  statusCode: number;
  message: string;
  _metadata?: IResponseMetadata;
  data?: T
}

export interface IResponsePagingPagination {
  totalPage: number;
  total: number;
}

export interface IResponsePaging<T = any> {
  _metadata?: IResponseMetadata;
  _pagination: IResponsePagingPagination;
  data: T[];
}
import { IMessageOptionsProperties } from '@common/message/interfaces/message.interface';
import { HttpStatus } from '@nestjs/common';

export interface IResponseCustomProperty {
  statusCode?: number;
  message?: string;
  httpStatus?: HttpStatus;
  messageProperties?: IMessageOptionsProperties;
}

// metadata
export interface IResponseMetadata {
  customProperty?: IResponseCustomProperty;
  [key: string]: any;
}

// type
export interface IResponse<T> {
  _metadata?: IResponseMetadata;
  data?: T;
}

export interface IResponsePagingPagination {
  totalPage: number;
  total: number;
}

export interface IResponsePaging<T> {
  _metadata?: IResponseMetadata;
  _pagination: IResponsePagingPagination;
  data: T[];
}


// decorator options
export interface IResponseOptions {
  messageProperties?: IMessageOptionsProperties;
  cached?: IResponseCacheOptions | boolean;
}

// cached
export interface IResponseCacheOptions {
  key?: string;
  ttl?: number;
}
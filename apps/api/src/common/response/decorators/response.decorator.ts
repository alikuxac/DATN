import {
  applyDecorators,
  SerializeOptions,
  SetMetadata,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseInterceptor } from '../../response/interceptors/response.default.interceptor';
import { ResponsePagingInterceptor } from '../../response/interceptors/response.paging.interceptor';
import { IResponseOptions } from '../interfaces/response.interface';
import { RESPONSE_MESSAGE_PATH_META_KEY, RESPONSE_MESSAGE_PROPERTIES_META_KEY } from '../constants/response.constant';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

export function Response(
  messagePath: string,
  options?: IResponseOptions
): MethodDecorator {
  const decorators: any = [UseInterceptors(ResponseInterceptor),
    SetMetadata(RESPONSE_MESSAGE_PATH_META_KEY, messagePath),
    SetMetadata(RESPONSE_MESSAGE_PROPERTIES_META_KEY, options?.messageProperties)]

  if (options?.cached) {
    decorators.push(UseInterceptors(CacheInterceptor));

    if (typeof options?.cached !== 'boolean') {
      if (options?.cached?.key) {
        decorators.push(CacheKey(options?.cached?.key));
      }

      if (options?.cached?.ttl) {
        decorators.push(CacheTTL(options?.cached?.ttl));
      }
    }
  }
  return applyDecorators(...decorators);
}

export function ResponsePaging(
  messagePath: string,
  options?: IResponseOptions
): MethodDecorator {
  const decorators: any = [
    UseInterceptors(ResponsePagingInterceptor),
    SetMetadata(RESPONSE_MESSAGE_PATH_META_KEY, messagePath),
    SetMetadata(
      RESPONSE_MESSAGE_PROPERTIES_META_KEY,
      options?.messageProperties
    ),
  ];

  if (options?.cached) {
    decorators.push(UseInterceptors(CacheInterceptor));

    if (typeof options?.cached !== 'boolean') {
      if (options?.cached?.key) {
        decorators.push(CacheKey(options?.cached?.key));
      }

      if (options?.cached?.ttl) {
        decorators.push(CacheTTL(options?.cached?.ttl));
      }
    }
  }

  return applyDecorators(...decorators);
}

export const ResponseSerializationOptions = SerializeOptions;

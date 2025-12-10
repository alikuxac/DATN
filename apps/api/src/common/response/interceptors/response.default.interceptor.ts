import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response } from 'express';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { IResponse } from '@common/response/interfaces/response.interface';
import {
  ResponseDto,
  ResponseMetadataDto,
} from '@common/response/dto/response.dto';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { RESPONSE_MESSAGE_PATH_META_KEY, RESPONSE_MESSAGE_PROPERTIES_META_KEY } from '../constants/response.constant';
import { IMessageOptionsProperties } from '@common/message/interfaces/message.interface';
import { HelperNumberService } from '@common/helper/services/helper.number.service';
import { MessageService } from '@common/message/services/message.service';
import { ENUM_MESSAGE_LANGUAGE } from '@repo/shared';
@Injectable()
export class ResponseInterceptor
  implements NestInterceptor<Promise<ResponseDto>> {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly helperDateService: HelperDateService,
    private readonly helperNumberService: HelperNumberService,
    private readonly messageService: MessageService
  ) { }

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Promise<ResponseDto>> {
    if (context.getType() === 'http') {
      return next.handle().pipe(
        map(async (res: Promise<any>) => {
          const ctx: HttpArgumentsHost = context.switchToHttp();
          const response: Response = ctx.getResponse();
          const request: IRequestApp = ctx.getRequest<IRequestApp>();

          let messagePath: string = this.reflector.get<string>(
            RESPONSE_MESSAGE_PATH_META_KEY,
            context.getHandler()
          );
          let messageProperties: IMessageOptionsProperties =
            this.reflector.get<IMessageOptionsProperties>(
              RESPONSE_MESSAGE_PROPERTIES_META_KEY,
              context.getHandler()
            );

          // set default response
          let httpStatus: HttpStatus = response.statusCode;
          let statusCode: number = response.statusCode;
          let data: Record<string, any> = undefined;

          // metadata
          const today = this.helperDateService.create();
          const xPath = request.path;
          const xId = request.__id ?? undefined;
          const xTimestamp =
            this.helperDateService.getTimestamp(today);
          const xTimezone = this.helperDateService.getZone(today);
          const xUserAgent = request.__userAgent ?? undefined;
          const xLanguage: string =
            request.__language ??
            this.configService.get<ENUM_MESSAGE_LANGUAGE>(
              'message.language'
            );
          
          let metadata: ResponseMetadataDto = {
            timestamp: xTimestamp,
            timezone: xTimezone,
            path: xPath,
          };

          // response
          const responseData = (await res) as IResponse<any>;

          if (responseData) {
            const { _metadata } = responseData;

            data = responseData.data;

            httpStatus =
              _metadata?.customProperty?.httpStatus ?? httpStatus;
            statusCode =
              _metadata?.customProperty?.statusCode ?? statusCode;
            messagePath =
              _metadata?.customProperty?.message ?? messagePath;
            messageProperties =
              _metadata?.customProperty?.messageProperties ??
              messageProperties;

            delete _metadata?.customProperty;

            metadata = {
              ...metadata,
              ..._metadata,
            };
          }

          const message: string = this.messageService.setMessage(
            messagePath,
            {
              customLanguage: xLanguage,
              properties: messageProperties,
            }
          );

          httpStatus = statusCode === 200 ? HttpStatus.OK : this.helperNumberService.mapHttpCode(statusCode);

          response.setHeader('x-timestamp', xTimestamp);
          response.setHeader('x-timezone', xTimezone);
          response.setHeader('x-id', xId);
          response.setHeader('x-user-agent', xUserAgent);

          response.status(httpStatus);

          return {
            statusCode,
            message,
            _metadata: metadata,
            data,
          };
        })
      );
    }

    return next.handle();
  }
}
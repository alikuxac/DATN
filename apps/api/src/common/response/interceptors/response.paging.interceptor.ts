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
import { Reflector } from '@nestjs/core';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { IResponsePaging } from '@common/response/interfaces/response.interface';
import {
    ResponsePagingDto,
    ResponsePagingMetadataDto,
} from '@common/response/dto/response.paging.dto';
import { ConfigService } from '@nestjs/config';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { RESPONSE_MESSAGE_PATH_META_KEY, RESPONSE_MESSAGE_PROPERTIES_META_KEY } from '../constants/response.constant';
import { IMessageOptionsProperties } from '@common/message/interfaces/message.interface';
import { ENUM_MESSAGE_LANGUAGE } from '@repo/shared';
import { MessageService } from '@common/message/services/message.service';
import { HelperNumberService } from '@common/helper/services/helper.number.service';

@Injectable()
export class ResponsePagingInterceptor
    implements NestInterceptor<Promise<ResponsePagingDto>>
{
    constructor(
        private readonly reflector: Reflector,
        private readonly configService: ConfigService,
        private readonly helperDateService: HelperDateService,
        private readonly helperNumberService: HelperNumberService,
        private readonly messageService: MessageService
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<Promise<ResponsePagingDto>> {
        if (context.getType() === 'http') {
            return next.handle().pipe(
                map(async (res: Promise<IResponsePaging<any>>) => {
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

                    let httpStatus: HttpStatus = response.statusCode;
                    let statusCode: number = response.statusCode;
                    let data: Record<string, any>[] = [];

                    // metadata
                    const today = this.helperDateService.create();
                    const xPath = request.path;
                    const xPagination = request.__pagination;
                    const xLanguage: string =
                        request.__language ??
                        this.configService.get<ENUM_MESSAGE_LANGUAGE>(
                            'message.language'
                        );

                    const xTimestamp =
                        this.helperDateService.getTimestamp(today);
                    const xTimezone = this.helperDateService.getZone(today);
                    
                    let metadata: ResponsePagingMetadataDto = {
                        language: xLanguage,
                        timestamp: xTimestamp,
                        timezone: xTimezone,
                        path: xPath,
                    };

                    // response
                    const responseData = (await res) as IResponsePaging<any>;
                    if (!responseData) {
                        throw new Error(
                            'ResponsePaging must instanceof IResponsePaging'
                        );
                    } else if (
                        !responseData.data ||
                        !Array.isArray(responseData.data)
                    ) {
                        throw new Error(
                            'Field data must in array and can not be empty'
                        );
                    }

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

                    // metadata pagination
                    metadata = {
                        ...metadata,
                        ..._metadata,
                        pagination: {
                            ...xPagination,
                            ...responseData._pagination,
                        },
                    };

                    httpStatus = this.helperNumberService.mapHttpCode(statusCode);

                    const message: string = this.messageService.setMessage(
                        messagePath,
                        {
                            customLanguage: xLanguage,
                            properties: messageProperties,
                        }
                    );
                  
                    response.setHeader('x-timestamp', xTimestamp);
                    response.setHeader('x-timezone', xTimezone);
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
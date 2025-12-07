import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { Response } from 'express';
import { IAppException } from '@app/interfaces/app.interface';
import { HelperDateService } from '@common/helper/services/helper.date.service';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { ResponseMetadataDto } from '@common/response/dto/response.dto';
import { MessageService } from '@common/message/services/message.service';
import { ENUM_MESSAGE_LANGUAGE } from '@common/message/enums/message.enum';

@Catch()
export class AppGeneralFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppGeneralFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
    private readonly messageService: MessageService,
    private readonly helperDateService: HelperDateService
  ) { }

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const { httpAdapter } = this.httpAdapterHost;

    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: IRequestApp = ctx.getRequest<IRequestApp>();

    this.logger.error(exception);

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const statusHttp = exception.getStatus();

      httpAdapter.reply(ctx.getResponse(), response, statusHttp);
      return;
    }

    // set default
    const statusHttp: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const messagePath = `http.${statusHttp}`;
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    // metadata
    const today = this.helperDateService.create();
    const xLanguage: string =
      request.__language ??
      this.configService.get<ENUM_MESSAGE_LANGUAGE>('message.language');
    const xTimestamp = this.helperDateService.getTimestamp(today);
    const xTimezone = this.helperDateService.getZone(today);
    const metadata: ResponseMetadataDto = {
      timestamp: xTimestamp,
      timezone: xTimezone,
      path: request.path,
      language: xLanguage,
    };

    const message: string = this.messageService.setMessage(messagePath, {
      customLanguage: xLanguage,
    })

    const responseBody: IAppException = {
      statusCode,
      message,
      _metadata: metadata,
    };

    response
      .setHeader('x-timestamp', xTimestamp)
      .setHeader('x-timezone', xTimezone)
      .status(statusHttp)
      .json(responseBody);

    return;
  }
}
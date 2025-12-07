import {
  Global,
  HttpStatus,
  Module,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';

import { IsPasswordConstraint } from './validations/request.is-password.validation';
import { IsStartWithConstraint } from './validations/request.is-start-with.validation';

import { MaxGreaterThanEqualConstraint } from './validations/request.max-greater-than-equal.validation';
import { MaxGreaterThanConstraint } from './validations/request.max-greater-than.validation';
import { MinGreaterThanEqualConstraint } from './validations/request.min-greater-than-equal.validation';
import { MinGreaterThanConstraint } from './validations/request.min-greater-than.validation';
import { IsOnlyDigitsConstraint } from './validations/request.only-digits.validation';
import { SafeStringConstraint } from './validations/request.safe-string.validation';



import { ENUM_REQUEST_STATUS_CODE_ERROR } from './enums/request.status-code.enum';

import { RequestTimeoutInterceptor } from './interceptors/request.timeout.interceptor';
import { MaxDateTodayConstraint } from './validations/request.max-date-today.validation';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTimeoutInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          skipNullProperties: false,
          skipUndefinedProperties: false,
          skipMissingProperties: false,
          forbidUnknownValues: false,
          transformOptions: { enableImplicitConversion: true },
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          exceptionFactory: async (errors: ValidationError[]) =>
            new UnprocessableEntityException({
              statusCode:
                ENUM_REQUEST_STATUS_CODE_ERROR.VALIDATION,
              errors,
            }),
        }),
    },
    IsPasswordConstraint,
    IsOnlyDigitsConstraint,
    SafeStringConstraint,
    IsStartWithConstraint,
    MinGreaterThanConstraint,
    MinGreaterThanEqualConstraint,
    MaxGreaterThanConstraint,
    MaxGreaterThanEqualConstraint,
    MaxDateTodayConstraint,
  ],
  exports: []
})
export class RequestModule {}

import { HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';

export class RequestValidationException extends Error {
  readonly httpStatus: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
  readonly statusCode: number = ENUM_STATUS_CODE_ERROR.REQUEST_VALIDATION;
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('request.validation');

    this.errors = errors;
  }
}
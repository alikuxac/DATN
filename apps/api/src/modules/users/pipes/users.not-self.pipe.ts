import {
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { IRequestApp } from '@common/request/interfaces/request.interface';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';

@Injectable({ scope: Scope.REQUEST })
export class UserNotSelfPipe implements PipeTransform {
  constructor(@Inject(REQUEST) protected readonly request: IRequestApp) { }

  async transform(value: string): Promise<string> {
    const { user } = this.request;
    if (user.user === value) {
      throw new BadRequestException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_SELF,
      });
    }

    return value;
  }
}
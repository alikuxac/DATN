import {
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

import { IRequestApp } from '@common/request/interfaces/request.interface';
import { ENUM_USER_STATUS_CODE_ERROR } from '@modules/users/enums/user.status-code.enum';

@Injectable({ scope: Scope.REQUEST })
export class UserNotSelfPipe implements PipeTransform {
  constructor(@Inject(REQUEST) protected readonly request: IRequestApp) { }

  async transform(value: string): Promise<string> {
    const { user } = this.request;
    if (user.user === value) {
      throw new BadRequestException({
        statusCode: ENUM_USER_STATUS_CODE_ERROR.NOT_SELF,
      });
    }

    return value;
  }
}
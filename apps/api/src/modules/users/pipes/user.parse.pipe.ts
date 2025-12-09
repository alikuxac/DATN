import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { UsersService } from '@modules/users/services/users.service';

@Injectable()
export class UserParsePipe implements PipeTransform {
  constructor(private readonly userService: UsersService) { }

  async transform(value: string) {
    const user = await this.userService.findOneById(value);
    if (!user) {
      throw new NotFoundException({
        statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
      });
    }

    return user;
  }
}
import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { ENUM_USER_STATUS_CODE_ERROR } from '@modules/users/enums/user.status-code.enum';
import { UsersService } from '@modules/users/services/users.service';

@Injectable()
export class UserParsePipe implements PipeTransform {
  constructor(private readonly userService: UsersService) { }

  async transform(value: string) {
    const user = await this.userService.findOneById(value);
    if (!user) {
      throw new NotFoundException({
        statusCode: ENUM_USER_STATUS_CODE_ERROR.NOT_FOUND,
      });
    }

    return user;
  }
}
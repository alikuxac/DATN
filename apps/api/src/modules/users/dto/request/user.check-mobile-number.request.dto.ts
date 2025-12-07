import { PickType } from '@nestjs/swagger';
import { UserUpdateMobileNumberRequestDto } from '@modules/users/dto/request/user.update-mobile-number.request.dto';

export class UserCheckMobileNumberRequestDto extends PickType(
    UserUpdateMobileNumberRequestDto,
    ['number'] as const
) {}

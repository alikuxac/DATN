import {
    ApiHideProperty,
    IntersectionType,
    OmitType,
    PickType,
} from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';
import { UserShortResponseDto } from '@modules/users/dto/response/user.short.response.dto';

export class UserCensorResponseDto extends IntersectionType(
    PickType(UserGetResponseDto, ['mobileNumber']),
    OmitType(UserShortResponseDto, [ 'email'])
) {


    @ApiHideProperty()
    @Exclude()
    email?: string;


}

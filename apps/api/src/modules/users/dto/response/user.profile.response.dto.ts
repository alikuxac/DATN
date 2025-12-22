import { UserGetResponseDto } from '@modules/users/dto/response/user.get.response.dto';
import { IUserProfileReponse } from '@repo/shared';

export class UserProfileResponseDto extends UserGetResponseDto implements IUserProfileReponse {}

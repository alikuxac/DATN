import { AuthLoginResponseDto } from '@modules/auth/dtos/response/auth.login.response.dto';
import { IAuthRefreshReponse } from '@repo/shared';

export class AuthRefreshResponseDto extends AuthLoginResponseDto implements IAuthRefreshReponse {}

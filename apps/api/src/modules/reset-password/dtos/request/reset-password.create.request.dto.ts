import { PickType } from '@nestjs/swagger';
import { AuthLoginRequestDto } from '@modules/auth/dtos/request/auth.login.request.dto';
import { IResetPasswordCreateRequest } from '@repo/shared';

export class ResetPasswordCreateRequestDto extends PickType(
    AuthLoginRequestDto,
    ['email'] as const
) implements IResetPasswordCreateRequest {}

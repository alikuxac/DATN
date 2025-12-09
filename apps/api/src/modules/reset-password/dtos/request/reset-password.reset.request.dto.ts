import { PickType } from '@nestjs/swagger';
import { AuthChangePasswordRequestDto } from '@modules/auth/dtos/request/auth.change-password.request.dto';
import { IResetPasswordResetRequest } from '@repo/shared';

export class ResetPasswordResetRequestDto extends PickType(
    AuthChangePasswordRequestDto,
    ['newPassword'] as const
) implements IResetPasswordResetRequest {}

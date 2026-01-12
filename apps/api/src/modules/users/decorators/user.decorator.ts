import { USER_GUARD_EMAIL_VERIFIED_META_KEY } from '@modules/users/constants/user.constant';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { UserSystemGuard } from '@modules/users/guards/user.guard';

export function UserProtected(
    emailVerified: boolean[] = [true]
): MethodDecorator {
    return applyDecorators(
        UseGuards(UserSystemGuard),
        SetMetadata(USER_GUARD_EMAIL_VERIFIED_META_KEY, emailVerified)
    );
}

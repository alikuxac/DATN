import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { AuthService } from '@modules/auth/services/auth.service';
import { UsersService } from '@modules/users/services/users.service';
import { UserDocument, UserEntity } from '../repository/entities/user.entity';
import { ENUM_USER_STATUS, ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { Reflector } from '@nestjs/core';
import { USER_GUARD_EMAIL_VERIFIED_META_KEY } from '@modules/users/constants/user.constant';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly userService: UsersService,
        private readonly authService: AuthService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const emailVerified =
            this.reflector.get<boolean[]>(
                USER_GUARD_EMAIL_VERIFIED_META_KEY,
                context.getHandler()
            ) || [];

        const request = context.switchToHttp().getRequest<IRequestApp>();
        const { user } = request.user;

        const userWithRole: UserDocument =
            await this.userService.findOneById(user);

        if (!userWithRole) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND,
                message: 'user.error.notFound',
            });
        } else if (userWithRole.status !== ENUM_USER_STATUS.ACTIVE) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_INACTIVE_FORBIDDEN,
                message: 'user.error.inactive',
            });
        }

        if (
            emailVerified.includes(true) &&
            userWithRole.verification.email !== true
        ) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.USER_EMAIL_NOT_VERIFIED,
                message: 'user.error.emailNotVerified',
            });
        }

        request.__user = userWithRole.toObject<UserEntity>();

        return true;
    }
}

import { AuthGuard } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ENUM_STATUS_CODE_ERROR } from '@repo/shared';
import { IAuthJwtAccessTokenPayload } from '@modules/auth/interfaces/auth.interface';

@Injectable()
export class AuthJwtAccessGuard extends AuthGuard('jwtAccess') {
    handleRequest<T = IAuthJwtAccessTokenPayload>(
        err: Error,
        user: T,
        info: Error
    ): T {
        if (err || !user) {
            throw new UnauthorizedException({
                statusCode: ENUM_STATUS_CODE_ERROR.AUTH_JWT_ACCESS_TOKEN,
                message: 'auth.error.accessTokenUnauthorized',
                _error: err ? err.message : info.message,
            });
        }

        const { sub } = user as IAuthJwtAccessTokenPayload;
        if (!sub) {
            throw new UnauthorizedException({
                statusCode: ENUM_STATUS_CODE_ERROR.AUTH_JWT_ACCESS_TOKEN,
                message: 'auth.error.accessTokenUnauthorized',
            });
        }

        return user;
    }
}

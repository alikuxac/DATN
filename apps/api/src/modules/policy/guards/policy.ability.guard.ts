import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { PolicyAbilityFactory } from '@modules/policy/factories/policy.factory';
import { IPolicyAbility } from '@modules/policy/interfaces/policy.interface';
import { POLICY_ABILITY_META_KEY } from '@modules/policy/constants/policy.constant';
import { ENUM_USER_ROLE, ENUM_STATUS_CODE_ERROR } from '@repo/shared';

@Injectable()
export class PolicyAbilityGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly policyAbilityFactory: PolicyAbilityFactory
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policies =
            this.reflector.get<IPolicyAbility[]>(
                POLICY_ABILITY_META_KEY,
                context.getHandler()
            ) || [];

        const { __user, user } = context
            .switchToHttp()
            .getRequest<IRequestApp>();

        if (!user) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.AUTH_JWT_ACCESS_TOKEN,
                message: 'auth.error.accessTokenUnauthorized',
            });
        }

        const { role } = user;

        if (role === ENUM_USER_ROLE.SUPER_ADMIN) {
            return true;
        } 
        if (policies.length === 0) {
            throw new ForbiddenException({
                statusCode:
                    ENUM_STATUS_CODE_ERROR.POLICY_ABILITY_PREDEFINED_NOT_FOUND,
                message: 'policy.error.abilityPredefinedNotFound',
            });
        }

        const userAbilities = this.policyAbilityFactory.createForUser(
            __user
        );
        const handler = this.policyAbilityFactory.handlerAbilities(userAbilities, policies);
        if (!handler) {
            throw new ForbiddenException({
                statusCode: ENUM_STATUS_CODE_ERROR.POLICY_ABILITY_FORBIDDEN,
                message: 'policy.error.abilityForbidden',
            });
        }

        return true;
    }
}

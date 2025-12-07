import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import {
    POLICY_ABILITY_META_KEY,
} from '@modules/policy/constants/policy.constant';
import { PolicyAbilityGuard } from '@modules/policy/guards/policy.ability.guard';
import { IPolicyAbility } from '@modules/policy/interfaces/policy.interface';

export function PolicyAbilityProtected(
    ...handlers: IPolicyAbility[]
): MethodDecorator {
    return applyDecorators(
        UseGuards(PolicyAbilityGuard),
        SetMetadata(POLICY_ABILITY_META_KEY, handlers)
    );
}

import {
    AbilityBuilder,
    createMongoAbility,
    ExtractSubjectType,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { 
    ENUM_POLICY_ACTION, 
    ENUM_POLICY_SUBJECT,
    ENUM_USER_ROLE,
    ENUM_REPORT_STATUS
} from '@repo/shared';
import {
    IPolicyAbility,
    IPolicyAbilityRule,
    IPolicyAbilitySubject,
} from '@modules/policy/interfaces/policy.interface';
import { UserEntity } from '@modules/users/repository/entities/user.entity';

@Injectable()
export class PolicyAbilityFactory {
    createForUser(user: UserEntity): IPolicyAbilityRule {
        const { can, cannot, build } = new AbilityBuilder<IPolicyAbilityRule>(
            createMongoAbility
        );

        // Super admin
        if (user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
            can(ENUM_POLICY_ACTION.MANAGE, 'all');
        }

        // Admin
        if (user.role === ENUM_USER_ROLE.ADMIN) {
            can(ENUM_POLICY_ACTION.MANAGE, ENUM_POLICY_SUBJECT.USER);

            cannot(ENUM_POLICY_ACTION.MANAGE, ENUM_POLICY_SUBJECT.USER, { role: ENUM_USER_ROLE.SUPER_ADMIN });

            can(ENUM_POLICY_ACTION.MANAGE, ENUM_POLICY_SUBJECT.REPORT);
            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.ACTIVITY);
            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.SESSION);
        }

        if (user.role === ENUM_USER_ROLE.USER) {
            can(ENUM_POLICY_ACTION.CREATE, ENUM_POLICY_SUBJECT.REPORT);
            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT, { by: user._id });
            can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.REPORT, { by: user._id });
            can(ENUM_POLICY_ACTION.DELETE, ENUM_POLICY_SUBJECT.REPORT, { by: user._id });

            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.USER, { _id: user._id });
            can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.USER, { _id: user._id });

            // Volunteer
            if (user.isVolunteer) {
                can(ENUM_POLICY_ACTION.READ, 'all');
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT, { status: ENUM_REPORT_STATUS.VERIFIED });
            }
        }

        return build({
            // Read https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types for details
            detectSubjectType: (item: any) =>
                item.constructor as ExtractSubjectType<IPolicyAbilitySubject>,
        });
    }

    handlerAbilities(
        userAbilities: IPolicyAbilityRule,
        abilities: IPolicyAbility[]
    ): boolean {
        return abilities.every((ability: IPolicyAbility) =>
            ability.action.every((action: ENUM_POLICY_ACTION) =>
                userAbilities.can(action, ability.subject)
            )
        );
    }
}

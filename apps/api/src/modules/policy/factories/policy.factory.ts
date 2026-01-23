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

        const defineUserPermissions = () => {
            can(ENUM_POLICY_ACTION.CREATE, ENUM_POLICY_SUBJECT.REPORT);
            // can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT, { user: user._id }); // OLD: restrict to own reports
            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT); // NEW: Allow read all (for Map)

            // User chỉ sửa/xóa khi Pending
            can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.REPORT, { by: user._id, status: ENUM_REPORT_STATUS.PENDING });
            can(ENUM_POLICY_ACTION.DELETE, ENUM_POLICY_SUBJECT.REPORT, { by: user._id, status: ENUM_REPORT_STATUS.PENDING });

            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.USER, { _id: user._id });
            can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.USER, { _id: user._id });

            can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.SESSION, { user: user._id })
            can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.SESSION, { user: user._id })
        };

        switch (user.role) {
            case ENUM_USER_ROLE.SUPER_ADMIN:
                can(ENUM_POLICY_ACTION.MANAGE, 'all');
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.USER);
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT);
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.ACTIVITY);
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.SESSION);
                break;
            case ENUM_USER_ROLE.ADMIN:
                can(ENUM_POLICY_ACTION.MANAGE, ENUM_POLICY_SUBJECT.USER);

                // Allow managing Users, but protect Super Admin modifications
                // cannot(ENUM_POLICY_ACTION.MANAGE, ENUM_POLICY_SUBJECT.USER, { role: ENUM_USER_ROLE.SUPER_ADMIN });
                cannot(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.USER, { role: ENUM_USER_ROLE.SUPER_ADMIN });
                cannot(ENUM_POLICY_ACTION.DELETE, ENUM_POLICY_SUBJECT.USER, { role: ENUM_USER_ROLE.SUPER_ADMIN });
                cannot(ENUM_POLICY_ACTION.CREATE, ENUM_POLICY_SUBJECT.USER, { role: ENUM_USER_ROLE.SUPER_ADMIN });

                // Explicitly allow READ User (Wins over cannot MANAGE if placed after)
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.USER); // Just to be safe

                // Reports & Others
                can(ENUM_POLICY_ACTION.MANAGE, ENUM_POLICY_SUBJECT.REPORT);
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT);

                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.ACTIVITY);
                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.SESSION);
                break;
            case ENUM_USER_ROLE.VOLUNTEER:
                defineUserPermissions();

                can(ENUM_POLICY_ACTION.READ, ENUM_POLICY_SUBJECT.REPORT, {
                    status: {
                        $in: [
                            ENUM_REPORT_STATUS.PENDING,
                            ENUM_REPORT_STATUS.IN_PROGRESS
                        ]
                    }
                });
                // Nhận nhiệm vụ
                can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.REPORT, { status: { $in: [ENUM_REPORT_STATUS.PENDING] } });
                // Cập nhật nhiệm vụ mình đang làm
                can(ENUM_POLICY_ACTION.UPDATE, ENUM_POLICY_SUBJECT.REPORT, {
                    status: ENUM_REPORT_STATUS.IN_PROGRESS,
                    rescuer: user._id
                });

                break;
            case ENUM_USER_ROLE.USER:
                defineUserPermissions();
                break;
            default:
                break;
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

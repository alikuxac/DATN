import { InferSubjects, MongoAbility } from '@casl/ability';
import {
    ENUM_POLICY_ACTION,
    ENUM_POLICY_SUBJECT,
} from '@modules/policy/enums/policy.enum';
import { UserEntity } from '@modules/users/repository/entities/user.entity';

export interface IPolicyAbility {
    subject: ENUM_POLICY_SUBJECT;
    action: ENUM_POLICY_ACTION[];
}

export type IPolicyAbilitySubject = InferSubjects<ENUM_POLICY_SUBJECT | typeof UserEntity> | 'all';

export type IPolicyAbilityRule = MongoAbility<
    [ENUM_POLICY_ACTION, IPolicyAbilitySubject]
>;

import { DatabaseEntity, DatabaseProp, DatabaseSchema } from '@common/database/decorators/database.decorator';
import { UserEntity } from '@modules/users/repository/entities/user.entity';
import { DatabaseUUIDEntityBase } from '@common/database/bases/database.uuid.entity';
import { ENUM_VERIFICATION_TYPE } from '@modules/verification/enums/verification.enum.constant';
import { IDatabaseDocument } from '@common/database/interfaces/database.interface';

export const VerificationTableName = 'Verifications';

@DatabaseEntity({ collection: VerificationTableName })
export class VerificationEntity extends DatabaseUUIDEntityBase {
    @DatabaseProp({
        required: true,
        ref: UserEntity.name,
        index: true,
        type: String,
    })
    user: string;

    @DatabaseProp({
        required: true,
        type: String,
    })
    to: string;

    @DatabaseProp({
        required: true,
        enum: ENUM_VERIFICATION_TYPE,
        index: true,
        type: String,
    })
    type: ENUM_VERIFICATION_TYPE;

    @DatabaseProp({
        required: true,
        trim: true,
    })
    otp: string;

    @DatabaseProp({
        required: true,
        type: Date,
    })
    expiredDate: Date;

    @DatabaseProp({
        required: false,
        type: Date,
    })
    verifyDate?: Date;

    @DatabaseProp({
        required: true,
        index: true,
        default: true,
    })
    isActive: boolean;

    @DatabaseProp({
        required: true,
        index: true,
        default: false,
    })
    isVerify: boolean;

    @DatabaseProp({
        required: true,
    })
    reference: string;
}

export const VerificationSchema =
    DatabaseSchema(VerificationEntity);
export type VerificationDoc = IDatabaseDocument<VerificationEntity>;

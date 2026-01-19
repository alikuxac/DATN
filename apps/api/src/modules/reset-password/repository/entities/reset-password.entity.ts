import { DatabaseEntity, DatabaseProp, DatabaseSchema } from '@common/database/decorators/database.decorator';
import { UserEntity } from '@modules/users/repository/entities/user.entity';
import { DatabaseUUIDEntityBase } from '@common/database/bases/database.uuid.entity';
import { ENUM_RESET_PASSWORD_TYPE } from '@repo/shared';
import { IDatabaseDocument } from '@common/database/interfaces/database.interface';

export const ResetPasswordTableName = 'ResetPasswords';

@DatabaseEntity({ collection: ResetPasswordTableName })
export class ResetPasswordEntity extends DatabaseUUIDEntityBase {
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
        trim: true,
        minlength: 8,
        maxlength: 8,
    })
    otp: string;

    @DatabaseProp({
        required: true,
        trim: true,
        unique: true,
        index: true,
        minlength: 20,
        maxlength: 20,
    })
    token: string;

    @DatabaseProp({
        required: true,
        index: true,
        enum: ENUM_RESET_PASSWORD_TYPE,
        type: String,
    })
    type: ENUM_RESET_PASSWORD_TYPE;

    @DatabaseProp({
        required: true,
        type: Date,
    })
    expiredDate: Date;

    @DatabaseProp({
        required: false,
        type: Date,
    })
    resetDate?: Date;

    @DatabaseProp({
        required: false,
        type: Date,
    })
    verifyDate?: Date;

    @DatabaseProp({
        required: true,
        index: true,
        default: false,
    })
    isReset: boolean;

    @DatabaseProp({
        required: true,
        index: true,
        default: false,
    })
    isActive: boolean;

    @DatabaseProp({
        required: true,
        index: true,
    })
    reference: string;
}

export const ResetPasswordSchema =
    DatabaseSchema(ResetPasswordEntity);
export type ResetPasswordDoc = IDatabaseDocument<ResetPasswordEntity>;

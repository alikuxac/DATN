import {
    PasswordHistoryDoc,
    PasswordHistoryEntity,
} from '@modules/password-history/repository/entities/password-history.entity';
import {
    UserDocument,
    UserEntity,
} from '@modules/users/repository/entities/user.entity';

export interface IPasswordHistoryEntity
    extends Omit<PasswordHistoryEntity, 'by'> {
    by: UserEntity;
}

export interface IPasswordHistoryDoc extends Omit<PasswordHistoryDoc, 'by'> {
    by: UserDocument;
}

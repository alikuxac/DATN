import {
    ActivityDoc,
    ActivityEntity,
} from '@modules/activity/repository/entities/activity.entity';
import {
    UserDocument,
    UserEntity,
} from '@modules/users/repository/entities/user.entity';

export interface IActivityEntity extends Omit<ActivityEntity, 'by'> {
    by: UserEntity;
}

export interface IActivityDoc extends Omit<ActivityDoc, 'by'> {
    by: UserDocument;
}

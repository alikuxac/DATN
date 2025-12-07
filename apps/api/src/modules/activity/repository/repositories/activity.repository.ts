import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseUUIDRepositoryBase } from '@common/database/bases/database.uuid.repository';
import { InjectDatabaseModel } from '@common/database/decorators/database.decorator';
import {
    ActivityDoc,
    ActivityEntity,
} from '@modules/activity/repository/entities/activity.entity';
import { UserEntity } from '@modules/users/repository/entities/user.entity';

@Injectable()
export class ActivityRepository extends DatabaseUUIDRepositoryBase<
    ActivityEntity,
    ActivityDoc
> {
    constructor(
        @InjectDatabaseModel(ActivityEntity.name)
        private readonly activityModel: Model<ActivityEntity>
    ) {
        super(activityModel, {
            path: 'by',
            localField: 'by',
            foreignField: '_id',
            model: UserEntity.name,
            justOne: true,
        });
    }
}

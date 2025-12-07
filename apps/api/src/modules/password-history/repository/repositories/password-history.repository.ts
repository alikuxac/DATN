import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseUUIDRepositoryBase } from '@common/database/bases/database.uuid.repository';
import { InjectDatabaseModel } from '@common/database/decorators/database.decorator';
import {
    PasswordHistoryDoc,
    PasswordHistoryEntity,
} from '@modules/password-history/repository/entities/password-history.entity';
import { UserEntity } from '@modules/users/repository/entities/user.entity';

@Injectable()
export class PasswordHistoryRepository extends DatabaseUUIDRepositoryBase<
    PasswordHistoryEntity,
    PasswordHistoryDoc
> {
    constructor(
        @InjectDatabaseModel(PasswordHistoryEntity.name)
        private readonly passwordHistoryModel: Model<PasswordHistoryEntity>
    ) {
        super(passwordHistoryModel, {
            path: 'by',
            localField: 'by',
            foreignField: '_id',
            model: UserEntity.name,
            justOne: true,
        });
    }
}

import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseObjectIdRepositoryBase } from '@common/database/bases/database.object-id.repository';
import { NotificationDocument, NotificationEntity } from '../entities/notification.entity';
import { InjectDatabaseModel } from '@common/database/decorators/database.decorator';
import { UserEntity } from '@modules/users/repository/entities/user.entity';

@Injectable()
export class NotificationRepository extends DatabaseObjectIdRepositoryBase<
  NotificationEntity,
  NotificationDocument
> {
  constructor(
    @InjectDatabaseModel(NotificationEntity.name)
    private readonly notificationModel: Model<NotificationEntity>
  ) {
    super(notificationModel, [
      {
        path: 'user',
        localField: 'user',
        foreignField: '_id',
        model: UserEntity.name,
        justOne: true,
      }
    ]);
  }
}

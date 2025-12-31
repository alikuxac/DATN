import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationEntity, NotificationSchema } from './entities/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { DATABASE_CONNECTION_NAME } from '@common/database/constants/database.constant';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        {
          name: NotificationEntity.name,
          schema: NotificationSchema,
        },
      ],
      DATABASE_CONNECTION_NAME
    ),
  ],
  providers: [NotificationRepository],
  exports: [NotificationRepository],
})
export class NotificationRepositoryModule { }

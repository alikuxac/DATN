import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { UsersModule } from '@modules/users/users.module';
import { NotificationService } from './notification.service';
import { NotificationRepositoryModule } from './repository/notification.repository.module';
import { AuthModule } from '@modules/auth/auth.module';
import { NotificationController } from './notification.controller';
import { BullModule } from '@nestjs/bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    UsersModule,
    NotificationRepositoryModule,
    AuthModule,
    BullModule.registerQueueAsync({
      name: ENUM_WORKER_QUEUES.NOTIFICATION_QUEUE,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService, NotificationProcessor],
  exports: [NotificationService, BullModule],
})
export class NotificationModule { }
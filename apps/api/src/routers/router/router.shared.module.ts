import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { UsersModule } from '@modules/users/users.module';
import { UserSharedController } from '@modules/users/controllers/user.shared.controller';
import { SessionModule } from '@modules/session/session.module';
import { SessionSharedController } from '@modules/session/controllers/session.shared.controller';
import { PasswordHistoryModule } from '@modules/password-history/password-history.module';
import { PasswordHistorySharedController } from '@modules/password-history/controllers/password-history.shared.controller';
import { ActivityModule } from '@modules/activity/activity.module';
import { ActivitySharedController } from '@modules/activity/controllers/activity.shared.controller';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    UsersModule, 
    SessionModule, 
    PasswordHistoryModule, 
    ActivityModule,
    BullModule.registerQueueAsync({
      name: ENUM_WORKER_QUEUES.EMAIL_QUEUE,
    })
  ],
  controllers: [
    UserSharedController,
    SessionSharedController,
    PasswordHistorySharedController,
    ActivitySharedController
  ],
})
export class RouterSharedModule { }
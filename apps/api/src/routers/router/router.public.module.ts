import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '@modules/auth/auth.module';
import { AuthPublicController } from '@modules/auth/controllers/auth.public.controller';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { UsersModule } from '@modules/users/users.module';
import { ResetPasswordPublicController } from '@modules/reset-password/controllers/reset-password.public.controller';
import { PasswordHistoryModule } from '@modules/password-history/password-history.module';
import { SessionModule } from '@modules/session/session.module';
import { ActivityModule } from '@modules/activity/activity.module';
import { VerificationModule } from '@modules/verification/verification.module';
import { HelloPublicController } from '@modules/hello/controllers/hello.public.controller';
import { ResetPasswordModule } from '@modules/reset-password/reset-password.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PasswordHistoryModule,
    ResetPasswordModule,
    SessionModule,
    ActivityModule,
    VerificationModule,
    BullModule.registerQueueAsync({
      name: ENUM_WORKER_QUEUES.EMAIL_QUEUE,
    })
  ],
  controllers: [AuthPublicController, ResetPasswordPublicController, HelloPublicController],
})
export class RoutesPublicModule { }
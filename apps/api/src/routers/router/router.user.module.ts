import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ActivityModule } from '@modules/activity/activity.module';
import { AuthModule } from '@modules/auth/auth.module';
import { SessionModule } from '@modules/session/session.module';
import { UserUserController } from '@modules/users/controllers/user.user.controller';
import { UsersModule } from '@modules/users/users.module';
import { VerificationUserController } from '@modules/verification/controllers/verification.user.controller';
import { VerificationModule } from '@modules/verification/verification.module';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { ReportsModule } from '@modules/reports/reports.module';
import { ReportUserController } from '@modules/reports/controllers/report.user.controller';

@Module({
    controllers: [
        UserUserController,
        ReportUserController,
        VerificationUserController,
    ],
    providers: [],
    exports: [],
    imports: [
        UsersModule,
        AuthModule,
        ActivityModule,
        ReportsModule,
        SessionModule,
        VerificationModule,
        BullModule.registerQueueAsync({
            name: ENUM_WORKER_QUEUES.EMAIL_QUEUE,
        }),
        BullModule.registerQueueAsync({
            name: ENUM_WORKER_QUEUES.SMS_QUEUE,
        }),
    ],
})
export class RouterUserModule {}

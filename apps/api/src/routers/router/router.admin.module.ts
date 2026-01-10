import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

import { UsersModule } from "@modules/users/users.module";
import { UserAdminController } from "@modules/users/controllers/user.admin.controller";
import { SessionModule } from "@modules/session/session.module";
import { SessionAdminController } from "@modules/session/controllers/session.admin.controller";
import { PasswordHistoryModule } from "@modules/password-history/password-history.module";
import { PasswordHistoryAdminController } from "@modules/password-history/controllers/password-history.admin.controller";
import { ActivityModule } from "@modules/activity/activity.module";
import { ActivityAdminController } from "@modules/activity/controllers/activity.admin.controller";
import { AuthModule } from "@modules/auth/auth.module";
import { ENUM_WORKER_QUEUES } from "@workers/enums/worker.enum";
import { VerificationModule } from "@modules/verification/verification.module";
import { ReportsModule } from "@modules/reports/reports.module";
import { ReportAdminController } from "@modules/reports/controllers/report.admin.controller";
import { AuthAdminController } from "@modules/auth/controllers/auth.admin.controller";
import { StatsModule } from "@modules/stats/stats.module";
import { StatsAdminController } from "@modules/stats/controllers/stats.admin.controller";
@Module({
  imports: [
    UsersModule,
    AuthModule,
    SessionModule,
    PasswordHistoryModule,
    ActivityModule,
    ReportsModule,
    VerificationModule,
    StatsModule,
    BullModule.registerQueueAsync({
      name: ENUM_WORKER_QUEUES.EMAIL_QUEUE,
    })
  ],
  controllers: [
    UserAdminController,
    SessionAdminController,
    PasswordHistoryAdminController,
    AuthAdminController,
    ActivityAdminController,
    ReportAdminController,
    StatsAdminController
  ],
})
export class RouterAdminModule { }
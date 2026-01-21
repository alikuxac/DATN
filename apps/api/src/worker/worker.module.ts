import { Module } from '@nestjs/common';
import { EmailModule } from '@modules/email/email.module';
import { EmailProcessor } from '@modules/email/processors/email.processor';
import { SessionModule } from '@modules/session/session.module';
import { ActivityModule } from '@modules/activity/activity.module';
import { ActivityProcessor } from '@modules/activity/processors/activity.processor';
import { NotificationModule } from '@modules/notifications/notification.module';
import { NotificationProcessor } from '@modules/notifications/processors/notification.processor';

@Module({
    imports: [EmailModule, SessionModule, ActivityModule, NotificationModule],
    providers: [EmailProcessor, ActivityProcessor, NotificationProcessor],
})
export class WorkerModule { }

import { Module } from '@nestjs/common';
import { ActivityRepositoryModule } from '@modules/activity/repository/activity.repository.module';
import { ActivityService } from '@modules/activity/services/activity.service';
import { BullModule } from '@nestjs/bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';

import { ActivityListener } from './services/activity.listener';

@Module({
    imports: [
        ActivityRepositoryModule,
        BullModule.registerQueueAsync({
            name: ENUM_WORKER_QUEUES.ACTIVITY_QUEUE,
        }),
    ],
    exports: [ActivityService, BullModule],
    providers: [ActivityService, ActivityListener],
    controllers: [],
})
export class ActivityModule { }

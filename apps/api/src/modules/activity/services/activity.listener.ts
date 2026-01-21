import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityCreateEvent } from '../events/activity.create.event';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { UserDocument } from '@modules/users/repository/entities/user.entity';

@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  constructor(
    @InjectQueue(ENUM_WORKER_QUEUES.ACTIVITY_QUEUE)
    private readonly activityQueue: Queue,
  ) { }

  @OnEvent('activity.create')
  async handleActivityCreateEvent(event: ActivityCreateEvent) {
    const { type, description, properties, user, by } = event;

    try {
      // Serialize IDs to avoid passing complex Mongoose documents to Redis
      const userId = typeof user === 'string' ? user : (user as UserDocument)?._id.toString();
      const byId = by ? (typeof by === 'string' ? by : (by as UserDocument)?._id.toString()) : undefined;

      if (!userId) return;

      // Add to BullMQ queue
      await this.activityQueue.add(type, {
        user: userId,
        by: byId,
        type,
        description,
        properties
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      });
    } catch (error: any) {
      this.logger.error(`Failed to add activity log to queue: ${error instanceof Error ? error.message : error}`);
    }
  }
}

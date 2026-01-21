import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { WorkerBase } from '@workers/bases/worker.base';
import { ActivityService } from '@modules/activity/services/activity.service';
import { UserDocument } from '@modules/users/repository/entities/user.entity';

@Processor(ENUM_WORKER_QUEUES.ACTIVITY_QUEUE)
export class ActivityProcessor extends WorkerBase {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(
    private readonly activityService: ActivityService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    const { user, type, description, by, properties } = job.data;

    try {
      const userId = typeof user === 'string' ? user : (user as UserDocument)?._id?.toString();
      const byId = by ? (typeof by === 'string' ? by : (by as UserDocument)?._id?.toString()) : undefined;

      if (!userId) return;

      const targetUser = { _id: userId } as UserDocument;

      if (byId) {
        await this.activityService.createByAdmin(
          targetUser,
          {
            by: byId,
            type,
            description,
            properties
          }
        );
      } else {
        await this.activityService.createByUser(
          targetUser,
          {
            type,
            description,
            properties
          }
        );
      }
    } catch (error: any) {
      this.logger.error(`Failed to process activity log: ${error.message}`);
      throw error;
    }
  }
}

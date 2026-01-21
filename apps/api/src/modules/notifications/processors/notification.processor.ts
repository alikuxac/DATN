import { Processor } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';
import { WorkerBase } from '@workers/bases/worker.base';
import { NotificationService } from '../notification.service';
import { UsersService } from '@modules/users/services/users.service';
import { NotificationGateway } from '../notification.gateway';
import { ENUM_NOTIFICATION_TYPE } from '@repo/shared';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Processor(ENUM_WORKER_QUEUES.NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerBase {
  private readonly logger = new Logger(NotificationProcessor.name);
  private expo: Expo;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly userService: UsersService,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super();
    this.expo = new Expo();
  }

  async process(job: Job<any, any, string>): Promise<void> {
    const { userId, type, title, body, payload } = job.data;

    try {
      // 1. Get user document (Note: In a production app, we'd use caching here)
      const user = await this.userService.findOneById(userId);
      if (!user) return;

      // 2. Check Notification Settings
      if (user.settings?.pushEnabled === false) return;
      if (type === ENUM_NOTIFICATION_TYPE.SOS && user.settings?.sosAlerts === false) return;
      if (type === ENUM_NOTIFICATION_TYPE.ACTIVITY && user.settings?.activityUpdates === false) return;
      if (type === ENUM_NOTIFICATION_TYPE.SYSTEM && user.settings?.newsLetters === false) return;

      // 3. Save to DB (Persistence)
      const savedNotification = await this.notificationService.create(userId, type, title, body, payload);

      // 4. Emit Socket (Foreground UI Update)
      this.notificationGateway.server.to(`user_${userId}`).emit('new_notification', {
        _id: savedNotification._id.toString(),
        type,
        title,
        body,
        isRead: false,
        createdAt: savedNotification.createdAt || new Date().toISOString(),
        data: payload,
      });

      // 5. Send Push Notification (Via Expo API)
      if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        const messages: ExpoPushMessage[] = [];
        const isSos = type === ENUM_NOTIFICATION_TYPE.SOS;

        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: title,
          body: body,
          data: payload,
          priority: isSos ? 'high' : 'default',
          channelId: isSos ? 'sos' : 'default',
        });

        await this.expo.sendPushNotificationsAsync(messages);
      }

    } catch (error: any) {
      this.logger.error(`Failed to process notification for user ${userId}: ${error.message}`);
      throw error; // Let BullMQ retry
    }
  }
}

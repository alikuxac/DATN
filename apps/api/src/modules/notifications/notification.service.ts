import { UsersService } from "@modules/users/services/users.service";
import { NotificationGateway } from "./notification.gateway";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { NotificationRepository } from "./repository/repositories/notification.repository";
import { NotificationEntity } from "./repository/entities/notification.entity";
import { ENUM_NOTIFICATION_TYPE, ENUM_REPORT_SOURCE, ENUM_REPORT_SEVERITY } from "@repo/shared";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { UserEntity } from "@modules/users/repository/entities/user.entity";
import { HelperGeoService } from "@common/helper/services/helper.geo.service";
import { HelperDateService } from "@common/helper/services/helper.date.service";
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ENUM_WORKER_QUEUES } from '@workers/enums/worker.enum';

@Injectable()
export class NotificationService {
  private expo: Expo;

  constructor(
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
    private readonly userService: UsersService,
    private readonly notificationRepository: NotificationRepository,
    private readonly helperGeoService: HelperGeoService,
    private readonly helperDateService: HelperDateService,
    @InjectQueue(ENUM_WORKER_QUEUES.NOTIFICATION_QUEUE)
    private readonly notificationQueue: Queue
  ) {
    this.expo = new Expo();
  }

  async create(userId: string, type: ENUM_NOTIFICATION_TYPE, title: string, body: string, data?: any) {
    const notification = new NotificationEntity();
    notification.user = userId;
    notification.type = type;
    notification.title = title;
    notification.body = body;
    notification.data = data;
    notification.isRead = false;

    return this.notificationRepository.create(notification);
  }

  async findAllByUser(userId: string, options?: any) {
    return this.notificationRepository.findAll({ user: userId }, options);
  }

  async getTotalByUser(userId: string, find?: Record<string, any>) {
    return this.notificationRepository.getTotal({ ...find, user: userId });
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.getTotal({
      user: userId,
      isRead: false,
    });
  }

  async markAsRead(id: string) {
    const updated = await this.notificationRepository.updateRaw(
      { _id: id },
      {
        $set: {
          isRead: true,
          readAt: this.helperDateService.create(),
        },
      }
    );

    if (updated) {
      // Gửi socket event để các device khác cập nhật trạng thái đã đọc
      this.notificationGateway.server.to(`user_${updated.user}`).emit('notification_read', {
        id: updated._id.toString(),
        isRead: true,
        readAt: updated.readAt,
      });
    }

    return updated;
  }

  // Hàm gửi thông báo thông minh (Refactored to use Queue)
  async sendToUser(userId: string, type: ENUM_NOTIFICATION_TYPE, title: string, body: string, payload: any) {
    try {
      await this.notificationQueue.add('send_notification', {
        userId,
        type,
        title,
        body,
        payload
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      });
    } catch (error) {
      console.error('Failed to queue notification', error);
      // Fallback: If queue fails, we could try to send it synchronously or just log
    }
  }

  @OnEvent('report.created')
  async handleReportCreated(payload: { reportId: string; regionId: string; data: any }) {
    // 1. Send socket event 'new_sos' to region room (Real-time for active app)
    this.notificationGateway.sendToRegion(payload.regionId, 'new_sos', payload.data);

    // 1b. Global broadcast to Admin Dashboard
    this.notificationGateway.server.to('admin_room').emit('new_sos', payload.data);

    // 2. Logic to find volunteers for Push Notifications + DB Storage
    const reportCoordinates = payload.data.location?.coordinates; // [lng, lat]
    if (reportCoordinates) {
      const [lng, lat] = reportCoordinates;
      const severity = payload.data.severity;
      const isUrgent = severity === ENUM_REPORT_SEVERITY.HIGH || severity === ENUM_REPORT_SEVERITY.CRITICAL;

      // Find Rescuers/Volunteers nearby
      // If urgent: send to everyone in 5km
      // If regular: limit to 25 closest volunteers to avoid spam
      const options: any = isUrgent ? {} : { paging: { limit: 25, offset: 0 } };

      const nearbyUsers = await this.userService.findRescuersNearby(
        lat,
        lng,
        5000,
        {}, // Optional filters logic already inside findRescuersNearby
        options
      );

      // Notify each selected volunteer
      for (const user of nearbyUsers) {
        // Skip creator
        if (user._id.toString() === payload.data.user) continue;

        const distance = this.helperGeoService.calculateDistance(
          lat,
          lng,
          user.location.coordinates[1],
          user.location.coordinates[0]
        );

        await this.sendToUser(
          user._id.toString(),
          ENUM_NOTIFICATION_TYPE.SOS,
          isUrgent ? '🆘 KHẨN CẤP: Cần cứu trợ ngay!' : '🔔 SOS: Cần hỗ trợ gần bạn',
          `Cách bạn ~${distance | 0}m. Nhấn để xem chi tiết.`,
          { reportId: payload.reportId, type: 'SOS_NEARBY', severity }
        );
      }
    }
  }

  // 2. Khi Rescuer nhận việc -> Báo cho User và các Rescuer khác
  @OnEvent('report.accepted')
  async handleReportAccepted(payload: {
    reportId: string;
    reporterId: string;
    rescuerId: string;
    regionId: string;
    report?: any;
  }) {
    // A. Báo cho người dân (Reporter): "Đã có người nhận!"
    // Chỉ báo nếu là USER report (Guest không có user ID để báo hoặc xử lý khác)
    if (payload.report?.source === ENUM_REPORT_SOURCE.APP) {
      await this.sendToUser(
        payload.reporterId,
        ENUM_NOTIFICATION_TYPE.ACTIVITY,
        'Cứu hộ đang tới!',
        'Một tình nguyện viên đã nhận hỗ trợ bạn.',
        {
          reportId: payload.reportId,
          rescuerId: payload.rescuerId,
        }
      );
    }

    // B. Báo cho các Rescuer khác trong vùng: "Kèo này có người nhận rồi, ẩn đi"
    // Client của Rescuer sẽ check: Nếu rescuerId != myId thì ẩn report này khỏi list
    // Cái này chỉ cần realtime socket update UI, không cần lưu notification cho TẤT CẢ mọi người (spam DB)
    this.notificationGateway.sendToRegion(payload.regionId, 'sos_locked', {
      reportId: payload.reportId,
      acceptedBy: payload.rescuerId, // Client dùng cái này để filter
    });
  }

  // 3. Sync preferences real-time giữa các thiết bị
  @OnEvent('user.preferences.updated')
  async handlePreferencesUpdated(payload: {
    userId: string;
    preferences: { theme: string; language: string }
  }) {
    // Emit WebSocket event đến tất cả devices của user
    this.notificationGateway.sendToUser(
      payload.userId,
      'preferences_updated',
      payload.preferences
    );
  }

  @OnEvent('session.force_logout')
  async handleForceLogout(payload: { userId: string; excludeSessionId: string; reason: string }) {
    this.notificationGateway.sendToUser(payload.userId, 'force_logout', {
      excludeSessionId: payload.excludeSessionId,
      reason: payload.reason,
    });
  }

  @OnEvent('user.volunteer.request_support')
  async handleVolunteerRequestSupport(payload: { volunteers: UserEntity[] | any[], coordinates: { lat: number, lng: number } }) {
    const { volunteers, coordinates } = payload;

    for (const volunteer of volunteers) {
      // Safe check for _id
      const userId = volunteer._id ? volunteer._id.toString() : volunteer.id;

      // Filter: Check if volunteer has enabled SOS alerts
      // If settings is missing (partial object), we might default to TRUE or skip.
      // Assuming critical alerts, we might want to send, but user asked to filter.
      // Let's check safely. 
      if (volunteer.settings) {
        if (volunteer.settings.pushEnabled === false || volunteer.settings.sosAlerts === false) {
          continue;
        }
      }

      await this.sendToUser(
        userId,
        ENUM_NOTIFICATION_TYPE.SYSTEM,
        '📢 YÊU CẦU HỖ TRỢ TỪ ADMIN',
        'Admin đang yêu cầu hỗ trợ viên ở gần khu vực này. Vui lòng kiểm tra bản đồ.',
        {
          action: 'VIEW_MAP',
          coordinates
        }
      );
    }
  }
}
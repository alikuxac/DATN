import { UsersService } from "@modules/users/services/users.service";
import { NotificationGateway } from "./notification.gateway";
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { NotificationRepository } from "./repository/repositories/notification.repository";
import { NotificationEntity } from "./repository/entities/notification.entity";
import { ENUM_NOTIFICATION_TYPE } from "@repo/shared";
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { UserEntity } from "@modules/users/repository/entities/user.entity";
import { HelperGeoService } from "@common/helper/services/helper.geo.service";

@Injectable()
export class NotificationService {
  private expo: Expo;

  constructor(
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway,
    private readonly userService: UsersService,
    private readonly notificationRepository: NotificationRepository,
    private readonly helperGeoService: HelperGeoService
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
          readAt: new Date(),
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

  // Hàm gửi thông báo thông minh
  async sendToUser(userId: string, type: ENUM_NOTIFICATION_TYPE, title: string, body: string, payload: any) {
    // 1. Lấy thông tin user (nên cache lại để đỡ query DB nhiều lần)
    const user = await this.userService.findOneById(userId);
    if (!user) return;

    // 2. CHECK SETTINGS (WORKFLOW CHẶN)

    // Cấp 1: Master Switch
    if (user.settings?.pushEnabled === false) {
      console.log(`User ${userId} đã tắt toàn bộ thông báo.`);
      return;
    }

    // Cấp 2: Từng loại cụ thể
    if (type === ENUM_NOTIFICATION_TYPE.SOS && user.settings?.sosAlerts === false) return;
    if (type === ENUM_NOTIFICATION_TYPE.ACTIVITY && user.settings?.activityUpdates === false) return;
    if (type === ENUM_NOTIFICATION_TYPE.SYSTEM && user.settings?.newsLetters === false) return;

    // 3. Persistence: Lưu vào DB
    await this.create(userId, type, title, body, payload);

    // 4. Gửi Socket (Foreground)
    this.notificationGateway.server.to(`user_${userId}`).emit('notification', {
      type,
      title,
      body,
      data: payload,
    });

    // 5. Gửi Push Notification (Background)
    if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      const messages: ExpoPushMessage[] = [];
      messages.push({
        to: user.expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: payload,
      });

      try {
        await this.expo.sendPushNotificationsAsync(messages);
      } catch (error) {
        console.error('Error sending push notification', error);
      }
    }
  }

  @OnEvent('report.created')
  async handleReportCreated(payload: { reportId: string; regionId: string; data: any }) {
    // 1. Gửi event 'new_sos' vào room region (Real-time cho app đang mở)
    this.notificationGateway.sendToRegion(payload.regionId, 'new_sos', payload.data);

    // 2. Logic tìm user xung quanh để gửi Push + Lưu Noti
    // Lấy tọa độ report
    const reportCoordinates = payload.data.location?.coordinates; // [lng, lat]
    if (reportCoordinates) {
      const [lng, lat] = reportCoordinates;
      // Tìm Rescuers/User gần đó (Ví dụ 5km)
      const nearbyUsers = await this.userService.findRescuersNearby(lat, lng, 5000);

      // Gửi Notification cho từng người
      for (const user of nearbyUsers) {
        // Skip chính người tạo report
        if (user._id.toString() === payload.data.user) continue;

        await this.sendToUser(
          user._id.toString(),
          ENUM_NOTIFICATION_TYPE.SOS,
          'Có SOS mới gần bạn!',
          `Một báo cáo khẩn cấp vừa được tạo cách bạn ${this.helperGeoService.calculateDistance(lat, lng, user.location.coordinates[1], user.location.coordinates[0]) | 0}m.`,
          { reportId: payload.reportId }
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
    regionId: string
  }) {
    // A. Báo cho người dân (Reporter): "Đã có người nhận!"
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
}
import { UsersService } from "@modules/users/services/users.service";
import { NotificationGateway } from "./notification.gateway";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly userService: UsersService
  ) { }

  // Hàm gửi thông báo thông minh
  async sendToUser(userId: string, type: 'SOS' | 'ACTIVITY' | 'SYSTEM', payload: any) {
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
    if (type === 'SOS' && user.settings?.sosAlerts === false) return;
    if (type === 'ACTIVITY' && user.settings?.activityUpdates === false) return;
    if (type === 'SYSTEM' && user.settings?.newsLetters === false) return;

    // 3. Nếu qua được hết các cửa ải trên -> Gửi Socket
    this.notificationGateway.server.to(userId).emit('notification', payload);

    // 4. (Optional) Bắn cả FCM (Push mobile khi tắt app) nếu cần
    // this.firebaseService.send(...)
  }

  @OnEvent('report.created')
  handleReportCreated(payload: { reportId: string; regionId: string; data: any }) {
    // Gửi event 'new_sos' vào room region
    this.notificationGateway.sendToRegion(payload.regionId, 'new_sos', payload.data);
  }

  // 2. Khi Rescuer nhận việc -> Báo cho User và các Rescuer khác
  @OnEvent('report.accepted')
  handleReportAccepted(payload: {
    reportId: string;
    reporterId: string;
    rescuerId: string;
    regionId: string
  }) {
    // A. Báo cho người dân (Reporter): "Đã có người nhận!"
    this.notificationGateway.sendToUser(payload.reporterId, 'sos_accepted', {
      reportId: payload.reportId,
      rescuerId: payload.rescuerId,
      message: 'Đội cứu hộ đang tới!',
    });

    // B. Báo cho các Rescuer khác trong vùng: "Kèo này có người nhận rồi, ẩn đi"
    // Client của Rescuer sẽ check: Nếu rescuerId != myId thì ẩn report này khỏi list
    this.notificationGateway.sendToRegion(payload.regionId, 'sos_locked', {
      reportId: payload.reportId,
      acceptedBy: payload.rescuerId, // Client dùng cái này để filter
    });
  }
}
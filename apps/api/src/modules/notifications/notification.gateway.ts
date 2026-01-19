import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';
import { NotificationService } from './notification.service';
import { OnEvent } from '@nestjs/event-emitter';
import { ENUM_USER_ROLE } from '@repo/shared';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationGateway');

  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService
  ) { }

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      if (userId) {

        await client.join(`user_${userId}`);
        client.data.userId = userId;

        // Fetch user to check role
        const user = await this.usersService.findOneById(userId);
        if (user && (user.role === ENUM_USER_ROLE.ADMIN || user.role === ENUM_USER_ROLE.SUPER_ADMIN)) {
          await client.join('admin_room');
          this.logger.log(`Admin joined admin_room: ${userId}`);
        }

        this.logger.log(`User connected: ${userId}`);
      }
    } catch (error) {
      this.logger.error('Connection error', error);
      client.disconnect();
    }
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { lat: number; lng: number, reportId?: string }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.lat || !payload.lng) return;

    try {
      // 1. Fetch User to update location
      const user = await this.usersService.findOneById(userId);
      if (user) {
        await this.usersService.updateLocation(user, payload.lat, payload.lng);
      }

      // 2. Realtime Tracking (Like Grab)
      if (payload.reportId) {
        client.to(`report_${payload.reportId}`).emit('rescuer_moved', {
          rescuerId: userId,
          lat: payload.lat,
          lng: payload.lng
        });
      }
    } catch (error) {
      this.logger.error(`Error updating location for user ${userId}`, error);
    }
  }

  @SubscribeMessage('join_report_room')
  async handleJoinReportRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { reportId: string }
  ) {
    if (!payload.reportId) return;
    await client.join(`report_${payload.reportId}`);
  }


  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string }
  ) {
    if (!payload.id) return;
    try {
      await this.notificationService.markAsRead(payload.id);
      // Optional: Log success
      // this.logger.debug(`Notification ${payload.id} marked as read via socket`);
    } catch (error: any) {
      this.logger.error(`Error marking notification as read: ${error?.message || error}`);
    }
  }

  @SubscribeMessage('join_region')
  async handleJoinRegion(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { regionId: string }
  ) {
    if (!payload.regionId) return;
    const roomName = `region_${payload.regionId}`;

    client.rooms.forEach((room) => {
      if (room.startsWith('region_') && room !== roomName) {
        client.leave(room);
      }
    });

    await client.join(roomName);

    // this.logger.debug(`Client ${client.id} joined region: ${roomName}`);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  sendToRegion(regionId: string, event: string, data: any) {
    this.server.to(`region_${regionId}`).emit(event, data);
  }

  // --- REPORT STATUS EVENTS ---

  @OnEvent('report.accepted')
  handleReportAccepted(payload: { reportId: string; rescuerId: string; report: any }) {
    const { reportId, rescuerId, report } = payload;
    this.logger.log(`Report ${reportId} accepted by ${rescuerId}. Source: ${report?.source}`);

    // Logic phân chia người nhận dựa trên Source
    if (report?.source === 'app') {
      // APP: Reporter, Admin, Rescuer đều cần nghe (đã join room report_ID)
      this.server.to(`report_${reportId}`).emit('report_accepted', {
        reportId,
        rescuerId,
        status: 'IN_PROGRESS'
      });
    } else {
      // GUEST: Chỉ Admin và Volunteer cần biết
      // Guest không có socket connection -> Không gửi vào user room
      // Nhưng Admin thì luôn cần -> Gửi Admin Room
      this.server.to('admin_room').emit('report_accepted', {
        reportId,
        rescuerId,
        status: 'IN_PROGRESS',
        isGuest: true
      });

      // Với Volunteer/Rescuer: Họ cũng đã join room report_ID khi bấm xem chi tiết/nhận đơn
      // Nên vẫn gửi vào room report_ID để cập nhật UI cho Volunteer
      this.server.to(`report_${reportId}`).emit('report_accepted', {
        reportId,
        rescuerId,
        status: 'IN_PROGRESS'
      });
    }
  }

  @OnEvent('report.resolved')
  handleReportResolved(payload: { reportId: string; report: any }) {
    const { reportId, report } = payload;
    this.logger.log(`Report ${reportId} resolved.`);

    if (report?.source === 'app') {
      this.server.to(`report_${reportId}`).emit('report_completed', {
        reportId,
        status: 'RESOLVED',
        message: 'Nhiệm vụ hoàn thành!'
      });
    } else {
      // Guest: Send to Admin & Rescuer (in report room)
      this.server.to('admin_room').emit('report_completed', {
        reportId,
        status: 'RESOLVED',
        isGuest: true
      });
      this.server.to(`report_${reportId}`).emit('report_completed', {
        reportId,
        status: 'RESOLVED'
      });
    }
  }

  @OnEvent('report.rejected')
  handleReportRejected(payload: { reportId: string; report: any; reason?: string }) {
    const { reportId, report, reason } = payload;
    this.logger.log(`Report ${reportId} rejected.`);

    if (report?.source === 'app') {
      this.server.to(`report_${reportId}`).emit('report_rejected', {
        reportId,
        status: 'REJECTED',
        reason: reason || 'Báo cáo đã bị từ chối'
      });
    } else {
      // Guest: Admin needs to know. 
      this.server.to('admin_room').emit('report_rejected', {
        reportId,
        status: 'REJECTED',
        reason: reason,
        isGuest: true
      });
    }
  }
}
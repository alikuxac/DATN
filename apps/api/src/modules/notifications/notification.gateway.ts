import {
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import { AuthService } from '@modules/auth/services/auth.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationGateway');

  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService
  ) { }

  async handleConnection(client: Socket) {
    try {
      let userId = client.handshake.query.userId as string;

      // Fallback: Verify Token if userId is not in query
      if (!userId && client.handshake.auth?.token) {
        try {
          const payload = this.authService.verifyAccessToken(client.handshake.auth.token);
          userId = payload.user || payload.sub;
        } catch (err) {
          this.logger.warn(`Invalid token for client ${client.id}`);
        }
      }

      if (userId) {

        await client.join(`user_${userId}`);
        client.data.userId = userId;

        // Track Online User
        await this.usersService.userConnected(userId);
        await this.broadcastOnlineCount();

        // Fetch user to check role
        const user = await this.usersService.findOneById(userId);
        if (user && (user.role === ENUM_USER_ROLE.ADMIN || user.role === ENUM_USER_ROLE.SUPER_ADMIN)) {
          await client.join('admin_room');
          this.logger.log(`Admin joined admin_room: ${userId}`);

          // Send immediate count to admin upon join
          const count = await this.usersService.getOnlineCount();
          client.emit('stats.online_users', { count });
        }

        this.logger.log(`User connected: ${userId}`);
      } else {
        // Optional: disconnect if unidentified?
        // client.disconnect();
      }
    } catch (error) {
      this.logger.error('Connection error', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      await this.usersService.userDisconnected(userId);
      // Update last seen one last time on disconnect
      await this.usersService.updateLastOnline(userId);
      await this.broadcastOnlineCount();
      this.logger.log(`User disconnected: ${userId}`);
    }
  }

  private async broadcastOnlineCount() {
    const count = await this.usersService.getOnlineCount();
    this.server.to('admin_room').emit('stats.online_users', { count });
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { lat: number; lng: number, reportId?: string }
  ) {
    const userId = client.data.userId;
    this.logger.log(`update_location received from user ${userId}: ${payload.lat}, ${payload.lng} (Report: ${payload.reportId})`);
    if (!userId || !payload.lat || !payload.lng) return;

    try {
      // 1. Fetch User to update location
      const user = await this.usersService.findOneById(userId);
      if (user) {
        await this.usersService.updateLocation(userId, payload.lat, payload.lng);
        // updateLocation already handles lastOnlineAt if implemented in service
        // But if we just want lightweight ping?
      } else {
        // If for some reason user not found (rare if guarded), but still valid token
        await this.usersService.updateLastOnline(userId);
      }

      // 2. Realtime Tracking (Like Grab)
      const moveData = {
        rescuerId: userId,
        lat: payload.lat,
        lng: payload.lng
      };

      if (payload.reportId) {
        client.to(`report_${payload.reportId}`).emit('rescuer_moved', moveData);
      }

      // Broadcast to region rooms as well
      client.rooms.forEach(room => {
        if (room.startsWith('region_')) {
          client.to(room).emit('rescuer_moved', moveData);
        }
      });
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

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string }
  ) {
    if (!payload.room) return;
    await client.leave(payload.room);
    // this.logger.debug(`Client ${client.id} left room: ${payload.room}`);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  sendToRegion(regionId: string, event: string, data: any) {
    this.server.to(`region_${regionId}`).emit(event, data);
  }

  // --- REPORT STATUS EVENTS ---

  @OnEvent('report.created')
  handleReportCreated(payload: { reportId: string; regionId: string; data: any }) {
    const { reportId, regionId, data } = payload;
    this.logger.log(`Report created ${reportId} in region ${regionId}`);

    // Broadcast to users in this region (Rescuers/Volunteers usually)
    if (regionId) {
      this.server.to(`region_${regionId}`).emit('report_created', {
        report: data
      });
    }

    // Always notify Admins
    this.server.to('admin_room').emit('report_created', {
      report: data
    });
  }

  @OnEvent('report.assigned')
  handleReportAssigned(payload: { reportId: string; rescuerId: string; assignerId: string; report: any }) {
    const { reportId, rescuerId } = payload;
    this.logger.log(`Report ${reportId} manually assigned to ${rescuerId}`);

    // Notify the volunteer explicitly
    this.server.to(`user_${rescuerId}`).emit('notification', {
      title: '🔔 Nhiệm vụ mới!',
      message: 'Admin đã chỉ định bạn một nhiệm vụ cứu trợ mới.',
      type: 'ASSIGNMENT',
      data: { reportId }
    });

    this.server.to(`user_${rescuerId}`).emit('report_assigned', {
      reportId
    });
  }

  @OnEvent('report.accepted')
  handleReportAccepted(payload: { reportId: string; rescuerId: string; regionId?: string; report: any }) {
    const { reportId, rescuerId, regionId, report } = payload;
    this.logger.log(`Report ${reportId} accepted by ${rescuerId}. Source: ${report?.source}`);

    // Broadcast to Region (So map users see status change)
    if (regionId) {
      this.server.to(`region_${regionId}`).emit('report_accepted', {
        reportId,
        rescuerId,
        status: 'IN_PROGRESS'
      });
    }

    // ... existing logic ...
    if (report?.source === 'app') {
      this.server.to(`report_${reportId}`).emit('report_accepted', {
        reportId,
        rescuerId,
        status: 'IN_PROGRESS'
      });
    } else {
      this.server.to('admin_room').emit('report_accepted', {
        reportId,
        rescuerId,
        status: 'IN_PROGRESS',
        isGuest: true
      });
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

    // Broadcast to Region
    if (report && report.regionId) {
      this.server.to(`region_${report.regionId}`).emit('report_completed', {
        reportId,
        status: 'RESOLVED',
        message: 'Nhiệm vụ hoàn thành!'
      });
    }

    if (report?.source === 'app') {
      this.server.to(`report_${reportId}`).emit('report_completed', {
        reportId,
        status: 'RESOLVED',
        message: 'Nhiệm vụ hoàn thành!'
      });
    } else {
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

  @OnEvent('report.cancelled')
  handleReportCancelled(payload: { reportId: string; regionId?: string; report: any }) {
    const { reportId, regionId, report } = payload;
    this.logger.log(`Report ${reportId} cancelled by rescuer. Returning to PENDING.`);

    // Broadcast to Region (So volunteers see it's available again)
    if (regionId) {
      this.server.to(`region_${regionId}`).emit('report_cancelled', {
        reportId,
        status: 'PENDING',
      });
    }

    // Notify the report owner if exists
    if (report?.user) {
      const userId = typeof report.user === 'object' ? report.user._id : report.user;
      this.server.to(`user_${userId}`).emit('report_cancelled', {
        reportId,
        status: 'PENDING',
        message: 'Tình nguyện viên đã hủy nhiệm vụ. Báo cáo đang chờ người khác nhận.',
      });
    }

    // Also notify admins
    this.server.to('admin_room').emit('report_cancelled', {
      reportId,
      status: 'PENDING',
    });
  }
}
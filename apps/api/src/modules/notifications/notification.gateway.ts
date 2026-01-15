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
      // 1. Update In DB (Fire & Forget)
      this.usersService.updateLocation(userId, payload.lat, payload.lng);

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
}
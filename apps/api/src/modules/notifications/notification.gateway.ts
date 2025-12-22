import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationGateway');

  constructor(private readonly usersService: UsersService) { }


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
    @MessageBody() payload: { lat: number; lng: number }
  ) {
    const userId = client.data.userId;
    if (!userId || !payload.lat || !payload.lng) return;

    try {
      await this.usersService.updateLocation(userId, payload.lat, payload.lng);
    } catch (error) {
      this.logger.error(`Error updating location for user ${userId}`, error);
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
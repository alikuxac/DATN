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

// Fake Simulation interface
interface SimulationTask {
  interval: NodeJS.Timeout;
  lat: number;
  lng: number;
  rescuerId: string;
  reportId: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationGateway');
  private activeSimulations: Map<string, SimulationTask> = new Map(); // reportId -> Task

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

  // --- CHEAT / SIMULATION LOGIC ---

  @OnEvent('report.accepted')
  handleReportAccepted(payload: { reportId: string; rescuerId: string; report: any }) {
    const { reportId, rescuerId, report } = payload;
    this.logger.log(`Report ${reportId} accepted by ${rescuerId}. Starting Simulation...`);

    // Stop existing if any
    if (this.activeSimulations.has(reportId)) {
      clearInterval(this.activeSimulations.get(reportId)!.interval);
      this.activeSimulations.delete(reportId);
    }

    // Start coordinate (Rescuer location ideally, but for cheat we mock around Victim)
    // Or just fetch rescuer location? For speed, let's use a fixed offset from Victim if available, 
    // or just increment from a base.
    // Let's assume Vol starts at 10.8, 106.6 or using current Rescuer Location if usersService has it.
    // For simplicity: Start from Report Location - 0.01 and move closer.
    // OR: Just increment whatever the Volunteer sends?
    // User Requirement: "Tự động cộng kinh độ/vĩ độ (lat + 0.0001, lng + 0.0001) mỗi 2 giây".

    // Let's assume we start from some coordinate.
    // Ideally we should get the volunteer's current location.
    // But since this is a "Cheat" inside backend, let's just pick a point near the report or 
    // better: Don't overwrite if the Volunteer IS sending real data.
    // But the user SAID: "Volunteer nhận đơn xong mà... để đó thì là lỗi nghiệp vụ lớn" -> "Fake Location Updates... Viết 1 cái cheat...".

    // Okay, let's fake it.
    let currentLat = report.location?.coordinates?.[1] || 10.762622;
    let currentLng = report.location?.coordinates?.[0] || 106.660172;

    // Start slightly away
    currentLat -= 0.005;
    currentLng -= 0.005;

    const interval = setInterval(() => {
      // Logic: Move towards the target (Report Location)
      // Target
      const targetLat = report.location?.coordinates?.[1];
      const targetLng = report.location?.coordinates?.[0];

      if (targetLat && targetLng) {
        // Move 10% of distance
        currentLat += (targetLat - currentLat) * 0.1;
        currentLng += (targetLng - currentLng) * 0.1;
      } else {
        // Fallback linear
        currentLat += 0.0001;
        currentLng += 0.0001;
      }

      // 1. Update DB (Optional, maybe skip to avoid writing too much)
      // this.usersService.updateLocation(rescuerId, currentLat, currentLng);

      // 2. Emit Socket
      this.server.to(`report_${reportId}`).emit('rescuer_moved', {
        rescuerId: rescuerId,
        lat: currentLat,
        lng: currentLng,
        isSimulated: true
      });

      // Also emit to the volunteer's user room so they see themselves move on map if they listen?
      // Usually Volunteer sends location, so we might conflict. 
      // But this is a "Cheat" for "Demo bị đơ". So acceptable.

    }, 2000);

    this.activeSimulations.set(reportId, {
      interval,
      lat: currentLat,
      lng: currentLng,
      rescuerId,
      reportId
    });
  }

  @OnEvent('report.resolved')
  handleReportResolved(payload: { reportId: string; report: any }) {
    const { reportId } = payload;
    this.logger.log(`Report ${reportId} resolved. Stopping Simulation.`);

    // 1. Stop Simulation
    if (this.activeSimulations.has(reportId)) {
      clearInterval(this.activeSimulations.get(reportId)!.interval);
      this.activeSimulations.delete(reportId);
    }

    // 2. Emit 'report_completed' to Global/Room
    // "Server phải bắn Socket report_completed về cho User và Admin"
    // Send to Report Room directly
    this.server.to(`report_${reportId}`).emit('report_completed', {
      reportId,
      status: 'RESOLVED',
      message: 'Nhiệm vụ hoàn thành!'
    });
  }
}
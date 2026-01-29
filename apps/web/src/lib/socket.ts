import { io, Socket } from 'socket.io-client';
import { WS_URL } from './axios';

export interface SocketEvents {
  // Server -> Client events
  notification: (data: unknown) => void;
  new_notification: (data: any) => void;
  new_sos: (data: any) => void;
  rescuer_moved: (data: { rescuerId: string; lat: number; lng: number }) => void;
  region_alert: (data: unknown) => void;
  'stats.online_users': (data: { count: number }) => void;
  force_logout: (data: any) => void;

  // Client -> Server events
  update_location: (data: { lat: number; lng: number, reportId?: string }) => void;
  mark_read: (data: { id: string }) => void;
  join_region: (data: { regionId: string }) => void;
}

let socket: Socket | null = null;

export const initializeSocket = (userId: string, token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  let url = `${WS_URL}/notifications`;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('ws://')) {
    url = url.replace('ws://', 'wss://');
  }

  socket = io(url, {
    query: { userId },
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('[WebSocket] Connected to server');
  });

  socket.on('disconnect', (reason) => {
    console.log('[WebSocket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[WebSocket] Connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[WebSocket] Socket disconnected and cleared');
  }
};

export const emitEvent = <K extends keyof SocketEvents>(
  event: K,
  data: Parameters<SocketEvents[K]>[0]
): void => {
  if (socket?.connected) {
    socket.emit(event as string, data);
  } else {
    console.warn(`[WebSocket] Cannot emit "${String(event)}" - socket not connected`);
  }
};

export const onEvent = <K extends keyof SocketEvents>(
  event: K,
  callback: SocketEvents[K]
): void => {
  socket?.on(event as string, callback);
};

export const offEvent = <K extends keyof SocketEvents>(
  event: K,
  callback?: SocketEvents[K]
): void => {
  if (callback) {
    socket?.off(event as string, callback);
  } else {
    socket?.off(event as string);
  }
};

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/ToastProvider';
import { Platform } from 'react-native';
import { addNotification, incrementUnread } from '@/store/slices/notificationSlice';
import { logout } from '@/store/slices/appSlice';

const SOCKET_URL = `https://${process.env.EXPO_PUBLIC_API_URL}/notifications`;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  alertData: any;
  setAlertData: (data: any) => void;
  sendLocationUpdate: (lat: number, lng: number, reportId?: string) => void;
}



const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error('useSocketContext must be used within SocketProvider');
    return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAppSelector((state) => state.app);
  const dispatch = useAppDispatch();
  const { showInfo, showError } = useToast();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alertData, setAlertData] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      query: { userId: user?._id },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Notification Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Notification Socket disconnected:', reason);
      setIsConnected(false);
    });

    // --- SOS (Background update for Map) ---
    newSocket.on('new_sos', (data: any) => {
      console.log('📍 [Map Update] NEW SOS RECEIVED:', data);
      // Logic xử lý map update
    });

    // --- Generic & System Notifications (Main UI Alert source) ---
    newSocket.on('new_notification', (data: any) => {
      console.log('🔔 [Alert] New Notification:', data);
      
      const isSos = data.type === 'SOS';
      const severity = data.data?.severity || 'high';

      if (isSos) {
        const sosAlert = {
          _id: data._id,
          title: data.title,
          content: data.body,
          level: (data.data?.source === 'GUEST' || severity === 'critical') ? 'CRITICAL' : 'HIGH',
          type: 'SOS',
          data: data.data,
        };
        handleCriticalAlert(sosAlert);
      } else {
        showInfo(data.title || 'Thông báo', data.body || data.message);
      }
      
      dispatch(addNotification({
        _id: data._id || Date.now().toString(),
        title: data.title,
        body: data.body || data.message,
        type: data.type || 'ACTIVITY',
        isRead: false,
        createdAt: data.createdAt || new Date().toISOString(),
        data: data.data
      }));
    });

    newSocket.on('force_logout', (data: any) => {
      dispatch(logout());
      showError('Đăng xuất', 'Tài khoản của bạn đã được đăng nhập trên thiết bị khác.');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?._id, dispatch]); // Re-connect if user ID changes (login success)

  const handleCriticalAlert = (data: any) => {
    if (data.level === 'CRITICAL') {
      if (Platform.OS !== 'web') {
        try {
            const { FeedbackUtils } = require('@/utils/feedback');
            FeedbackUtils.vibrateEmergency();
            FeedbackUtils.playSiren();
        } catch (e) {}
      }
      setAlertData(data);
    } else {
      showInfo(data.title, data.content || data.body);
    }
  };

  const sendLocationUpdate = (lat: number, lng: number, reportId?: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_location', { lat, lng, reportId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, alertData, setAlertData, sendLocationUpdate }}>
      {children}
    </SocketContext.Provider>
  );
};

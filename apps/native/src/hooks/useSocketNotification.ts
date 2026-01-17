import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/ToastProvider';
import { Vibration, Platform } from 'react-native';

const SOCKET_URL = `https://${process.env.EXPO_PUBLIC_API_URL}/notifications`;

export const useSocketNotification = () => {
  const { token } = useAppSelector((state) => state.app);
  const { showInfo, showSuccess, showError } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [alertData, setAlertData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Chỉ kết nối khi có Token
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // 2. Khởi tạo Socket với Auth Token
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Notification Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Notification Socket disconnected:', reason);
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (err) => {
      console.log('⚠️ Socket connect error:', err.message);
      setIsConnected(false);
    });

    // --- FORCE LOGOUT ---
    newSocket.on('force_logout', (data: any) => {
      console.log('🚪 FORCE LOGOUT:', data);

      import('@/store').then(({ store }) => {
        import('@/store/slices/appSlice').then(({ logout }) => {
          store.dispatch(logout());
          showError('Đăng xuất', 'Tài khoản của bạn đã được đăng nhập trên thiết bị khác.');
        });
      });
    });

    // --- CÁC SỰ KIỆN LẮNG NGHE ---

    // A. Tin nhắn thường
    newSocket.on('new_notification', (data: any) => {
      console.log('🔔 New Notification:', data);
      showInfo(data.title || 'Thông báo', data.message);
    });

    // B. Cảnh báo Chính phủ
    newSocket.on('system_alert', (data: any) => {
      console.log('⚠️ System Alert:', data);
      handleCriticalAlert(data);
    });

    // C. SOS
    newSocket.on('new_sos', (data: any) => {
      console.log('🆘 NEW SOS RECEIVED:', data);

      const sosAlert = {
        title: 'CÓ YÊU CẦU CỨU TRỢ MỚI!',
        content: `Cần cứu trợ khẩn cấp tại ${data.address || 'vị trí gần bạn'}.`,
        level: 'CRITICAL',
        type: 'SOS',
        data: data,
      };

      handleCriticalAlert(sosAlert);
    });

    newSocket.on('sos_locked', (data: any) => {
      showInfo('Thông tin', 'Yêu cầu cứu trợ đã có đơn vị tiếp nhận.');
    });

    // D. PREFERENCES SYNC
    newSocket.on('preferences_updated', (data: { theme: string; language: string }) => {
      console.log('🔄 Preferences updated from another device:', data);

      import('@/store').then(({ store }) => {
        import('@/store/slices/appSlice').then(({ setTheme, setLanguage }) => {
          const currentState = store.getState().app;

          if (data.theme && data.theme !== currentState.theme) {
            store.dispatch(setTheme(data.theme as any));
          }

          if (data.language && data.language !== currentState.language) {
            store.dispatch(setLanguage(data.language as any));
            import('@/config/i18n').then((i18nModule) => {
              i18nModule.default.changeLanguage(data.language);
            });
          }
        });
      });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Hàm xử lý Rung + Hiện Modal
  const handleCriticalAlert = (data: any) => {
    if (data.level === 'CRITICAL' || data.type === 'SOS') {
      if (Platform.OS !== 'web') {
        const { FeedbackUtils } = require('../utils/feedback');
        FeedbackUtils.vibrateEmergency();
        FeedbackUtils.playSiren();
      }
      setAlertData(data);
    } else {
      showInfo(`⚠️ ${data.title}`, data.content);
    }
  };

  return { socket, alertData, setAlertData, isConnected };
};
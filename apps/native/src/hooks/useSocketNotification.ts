import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/ToastProvider';
import { Vibration, Platform } from 'react-native';

const SOCKET_URL = `https://${process.env.EXPO_PUBLIC_API_URL}/notifications`;

export const useSocketNotification = () => {
  const { token } = useAppSelector((state) => state.app);
  const { showInfo, showSuccess, showError } = useToast(); // Thêm các loại toast khác nếu cần
  const [socket, setSocket] = useState<Socket | null>(null);
  const [alertData, setAlertData] = useState<any>(null); // State cho Modal Cảnh báo/SOS

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Chỉ kết nối khi có Token
    if (!token) {
      // Nếu logout thì disconnect ngay
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // 2. Khởi tạo Socket với Auth Token (Bảo mật hơn)
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Notification Socket connected:', newSocket.id);
    });

    // --- FORCE LOGOUT ---
    newSocket.on('force_logout', (data: any) => {
      console.log('🚪 FORCE LOGOUT:', data);
      // data.reason is a translation key, e.g., 'auth.error.forceLogout'

      // Import i18n safely if needed, or use a hardcoded message for now if t() isn't available here.
      // But we usually have i18n initialized globally. 
      // Let's try to get translation if possible, or just show a generic message + reason key if checking debug.
      // Actually, we can use the `showInfo` or `showError`.
      // Better: Alert and Logout.

      // We need to import store dispatch/logout outside hook if we want to be sure, 
      // OR rely on the hook's context. 
      // The hook uses `useAppSelector` but not dispatch. Let's get dispatch.
      // Wait, `useSocketNotification` doesn't return dispatch.
      // We should import store directly to dispatch logout, like in api.service.

      import('@/store').then(({ store }) => {
        import('@/store/slices/appSlice').then(({ logout }) => {
          store.dispatch(logout());
          showError('Đăng xuất', 'Tài khoản của bạn đã được đăng nhập trên thiết bị khác.');
        });
      });
    });

    // --- CÁC SỰ KIỆN LẮNG NGHE ---

    // A. Tin nhắn thường (Marketing, System info...)
    newSocket.on('new_notification', (data: any) => {
      console.log('🔔 New Notification:', data);
      showInfo(data.title || 'Thông báo', data.message);
    });

    // B. Cảnh báo Chính phủ (Bão lũ, sạt lở...)
    newSocket.on('system_alert', (data: any) => {
      console.log('⚠️ System Alert:', data);
      handleCriticalAlert(data);
    });

    // C. 🆘 CỨU TRỢ KHẨN CẤP (SOS) - Quan trọng nhất
    // Khi Rescuer ở trong vùng có người kêu cứu
    newSocket.on('new_sos', (data: any) => {
      console.log('🆘 NEW SOS RECEIVED:', data);

      // Chế biến data để hiển thị lên Modal cảnh báo
      const sosAlert = {
        title: 'CÓ YÊU CẦU CỨU TRỢ MỚI!',
        content: `Cần cứu trợ khẩn cấp tại ${data.address || 'vị trí gần bạn'}.`,
        level: 'CRITICAL', // Mức độ cao nhất
        type: 'SOS',       // Loại SOS để UI hiển thị màu đỏ chót
        data: data,        // Kèm data gốc để bấm vào xem bản đồ
      };

      handleCriticalAlert(sosAlert);
    });

    // Sự kiện khi có người nhận SOS (để ẩn tin cũ đi nếu cần)
    newSocket.on('sos_locked', (data: any) => {
      // Logic: Nếu tin SOS mình đang xem đã có người nhận -> Thông báo nhẹ
      showInfo('Thông tin', 'Yêu cầu cứu trợ đã có đơn vị tiếp nhận.');
    });

    // D. 🔄 SYNC PREFERENCES - Real-time sync giữa các thiết bị
    newSocket.on('preferences_updated', (data: { theme: string; language: string }) => {
      console.log('🔄 Preferences updated from another device:', data);

      // Import động để tránh circular dependency
      import('@/store').then(({ store }) => {
        import('@/store/slices/appSlice').then(({ setTheme, setLanguage }) => {
          const currentState = store.getState().app;

          // Chỉ update nếu khác với state hiện tại (tránh loop)
          if (data.theme && data.theme !== currentState.theme) {
            store.dispatch(setTheme(data.theme as any));
          }

          if (data.language && data.language !== currentState.language) {
            store.dispatch(setLanguage(data.language as any));
            // Sync i18n
            import('@/config/i18n').then((i18nModule) => {
              i18nModule.default.changeLanguage(data.language);
            });
          }
        });
      });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [token]); // Chạy lại khi token thay đổi (Login/Logout)

  // Hàm xử lý Rung + Hiện Modal
  const handleCriticalAlert = (data: any) => {
    if (data.level === 'CRITICAL' || data.type === 'SOS') {
      // Rung mạnh: 0ms delay, rung 500ms, nghỉ 200ms, rung 500ms...
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 500, 200, 500, 200, 1000]);
      }
      setAlertData(data); // Hiện Modal đè lên tất cả
    } else {
      showInfo(`⚠️ ${data.title}`, data.content);
    }
  };

  return { socket, alertData, setAlertData };
};
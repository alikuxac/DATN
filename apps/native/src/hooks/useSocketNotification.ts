import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/ui/ToastProvider';
import { Vibration, Platform } from 'react-native';

// 💡 Mẹo: Nên đưa vào biến môi trường (.env)
const SOCKET_URL = 'https://laptop-api.alikuxac.xyz/notifications';

export const useSocketNotification = () => {
  const { token, user } = useAppSelector((state) => state.app);
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
      auth: { token }, // 👈 QUAN TRỌNG: Gửi token qua auth header
      // query: { userId: user._id }, // Không cần gửi userId nữa, Server tự decode token
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Notification Socket connected:', newSocket.id);
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
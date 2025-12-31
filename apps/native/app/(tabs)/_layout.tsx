import { Tabs } from 'expo-router';
import CustomTabBar from '@/navigation/components/CustomTabBar';
import { useSocketNotification } from '@/hooks/useSocketNotification';
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addNotification, markAsReadLocal, setUnreadCount } from '@/store/slices/notificationSlice';
import { apiService } from '@/services/api.service';

export default function TabLayout() {
  const { socket } = useSocketNotification();
  const dispatch = useAppDispatch();

  // Initial Fetch Unread Count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await apiService.get<any>('/notifications/unread-count');
        if (response.data && typeof response.data.count === 'number') {
          dispatch(setUnreadCount(response.data.count));
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
  }, [dispatch]);

  // Global Socket Listeners for Badge
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (payload: any) => {
       // Assuming payload confirms to NotificationItem or we map it
       // Ensure payload has isRead: false by default if coming from socket
       const item = { ...payload, isRead: false }; 
       dispatch(addNotification(item));
    });

    socket.on('notification_read', (payload: { id: string }) => {
       dispatch(markAsReadLocal(payload.id));
    });

    return () => {
      socket.off('notification');
      socket.off('notification_read');
    }
  }, [socket, dispatch]);

  return (
    <Tabs
    screenOptions={{
      headerShown: false,
    }}
    tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Bản đồ',
        }}
      />
      <Tabs.Screen
          name="reports"
          options={{
              title: 'Báo cáo',
          }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
        }}
      />
    </Tabs>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocketNotification } from '@/hooks/useSocketNotification';

import { apiService } from '@/services/api.service';
import NotificationItem from '@/components/notifications/NotificationItem';
import { AppColors } from '@/config/colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotifications, addNotification, markAsReadLocal, setUnreadCount } from '@/store/slices/notificationSlice';

// Interface for Notification Type
interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: notifications = [] } = useAppSelector((state) => state.notification);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Socket listeners are handled globally in _layout.tsx to prevent duplication
  // and ensure unread count is accurate across the app.
  const { socket } = useSocketNotification();

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (data: any) => {
        console.log('New notification received:', data);
        dispatch(addNotification(data));
    };

    socket.on('notification', handleNewNotification);
    socket.on('new_notification', handleNewNotification);

    return () => {
        socket.off('notification', handleNewNotification);
        socket.off('new_notification', handleNewNotification);
    };
  }, [socket, dispatch]);



  const handleMarkRead = async (id: string) => {
    try {
      // Optimistic Update (Instant feedback)
      dispatch(markAsReadLocal(id));

      // Fire-and-forget (don't await if you want truly instant, but safe to await for error handling if needed, 
      // but requirement says 'Fire-and-forget')
      apiService.patch(`/notifications/${id}/read`, {}).catch(err => console.error("Background sync failed", err));
      
      if (socket) {
        socket.emit('mark_read', { id });
      }
      


    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handlePress = (item: Notification) => {
    // If unread, mark as read
    if (!item.isRead) {
      handleMarkRead(item._id);
    }
    
    // Navigate if type is not SYSTEM and has ID
    if (item.type !== 'SYSTEM') {
        // Prefer data.reportId if available, or try to use data._id or infer logic
        // Assuming socket/api returns data object with reportId or similar. 
        // Based on user request/implementations, let's assume item.data contains payload.
        const reportId = item.data?.reportId || item.data?.id; 
        if (reportId) {
            router.push(`/report/${reportId}`);
        } else {
             console.warn('No report ID found in notification data', item.data);
        }
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiService.get<any>('/notifications');
      dispatch(setNotifications(response.data.data)); 

      // Sync unread count as well
      const countResponse = await apiService.get<any>('/notifications/unread-count');
      if (countResponse.data && typeof countResponse.data.count === 'number') {
        dispatch(setUnreadCount(countResponse.data.count));
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
        {notifications.length === 0 ? (
            <View style={styles.center}>
                <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
            </View>
        ) : (
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                <NotificationItem
                    item={item}
                    onPress={handlePress}
                    onMarkRead={handleMarkRead}
                />
                )}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={styles.listContent}
            />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
      color: '#999',
      fontSize: 16
  }
});

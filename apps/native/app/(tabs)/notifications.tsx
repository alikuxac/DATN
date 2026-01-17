import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSocketNotification } from '@/hooks/useSocketNotification';
import { apiService } from '@/services/api.service';
import NotificationItem from '@/components/notifications/NotificationItem';
import { AppColors } from '@/config/colors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotifications, addNotification, markAsReadLocal } from '@/store/slices/notificationSlice';

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
  const { socket } = useSocketNotification();
  // Socket Listeners - Handled globally in _layout, but keeping specific logic if needed
  // Actually, for mark read synchronization we rely on the global listener updating the store.
  // For new notifications, the global listener adds them to the store.
  // So we technically don't need listeners here if the list is driven by Redux.
  // However, if we want to show a toast or something specific to this screen, we could keep it.
  // But strictly for the bug fix: remove broken lines.
  
  useEffect(() => {
     // Optional: Add specific listeners here if not covered globally
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      // Optimistic Update (Instant feedback)
      dispatch(markAsReadLocal(id));

      // Fire-and-forget (don't await if you want truly instant, but safe to await for error handling if needed, 
      // but requirement says 'Fire-and-forget')
      apiService.patch(`/notifications/${id}/read`, {}).catch(err => console.error("Background sync failed", err));
      
      // If socket also emits 'mark_read', redundancy is fine as local state is already read.
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
      // Don't set loading true here to avoid flickering on refresh
      const response = await apiService.get<any>('/notifications');
      dispatch(setNotifications(response.data.data)); // Assumes response structure { data: { data: [...] } } or adjust based on API
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

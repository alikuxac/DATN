'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const { socket, isConnected, on, off, emit } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for new notifications
  useEffect(() => {
    if (!isConnected) return;

    const handleNotification = (data: unknown) => {
      console.log('[useNotifications] New notification received:', data);

      const notification = data as Notification;
      setNotifications((prev) => [notification, ...prev]);

      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }

      // Invalidate notifications query to refetch from server
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [isConnected, on, off, queryClient]);

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!isConnected) {
        console.warn('[useNotifications] Cannot mark as read - not connected');
        return;
      }

      emit('mark_read', { id: notificationId });

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Invalidate query to sync with server
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    [isConnected, emit, queryClient]
  );

  // Join a region to receive region-specific alerts
  const joinRegion = useCallback(
    (regionId: string) => {
      if (!isConnected) {
        console.warn('[useNotifications] Cannot join region - not connected');
        return;
      }

      emit('join_region', { regionId });
      console.log(`[useNotifications] Joined region: ${regionId}`);
    },
    [isConnected, emit]
  );

  // Update location
  const updateLocation = useCallback(
    (lat: number, lng: number) => {
      if (!isConnected) {
        console.warn('[useNotifications] Cannot update location - not connected');
        return;
      }

      emit('update_location', { lat, lng });
    },
    [isConnected, emit]
  );

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    joinRegion,
    updateLocation,
  };
};

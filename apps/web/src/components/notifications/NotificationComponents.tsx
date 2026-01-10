'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle } from 'lucide-react';

export const NotificationBell = () => {
  const { isConnected, unreadCount, notifications, markAsRead } = useNotifications();

  useEffect(() => {
    console.log('[NotificationBell] WebSocket connected:', isConnected);
  }, [isConnected]);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        title={`${unreadCount} unread notifications`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-background" />
        )}
      </button>
    </div>
  );
};

export const NotificationList = () => {
  const { notifications, markAsRead, isConnected } = useNotifications();

  return (
    <div className="w-full max-w-md space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read ? 'bg-background' : 'bg-muted'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

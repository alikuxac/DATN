"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useSocketContext } from "@/contexts/SocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
// import { useNotifications } from "@/hooks/useNotifications"; // Might need to create this later if not exists or use direct api call

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export function NotificationCenter() {
  const { socket, isConnected } = useSocketContext();
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load initial notifications (mock for now or TODO: fetch from API)
  // For now we start empty and wait for socket events
  // Actually we should fetch recent notifications. 
  // Skipping fetch for this iteration to focus on socket and UI structure.

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      console.log("Received notification:", data);
      const newNotification: Notification = {
        _id: data._id || Date.now().toString(),
        title: data.title || "New Notification",
        message: data.body || data.message || "",
        type: data.type || "INFO",
        isRead: false,
        createdAt: data.createdAt || new Date().toISOString(),
        metadata: data.data || data.metadata,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setHasUnread(true);
    };

    const handleNewSos = (data: any) => {
      console.log("🆘 Received SOS Alert:", data);
      const newNotification: Notification = {
        _id: data._id || Date.now().toString(),
        title: "🆘 SOS KHẨN CẤP",
        message: `Báo cáo mới từ ${data.source === 'GUEST' ? 'Khách vãng lai' : data.user?.firstName || 'User'}: ${data.type}`,
        type: "SOS",
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: { reportId: data._id, ...data },
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setHasUnread(true);
    };

    socket.on("notification", handleNewNotification);
    socket.on("new_notification", handleNewNotification);
    socket.on("new_sos", handleNewSos);

    return () => {
      socket.off("notification", handleNewNotification);
      socket.off("new_notification", handleNewNotification);
      socket.off("new_sos", handleNewSos);
    };
  }, [socket]);

  const handleNotificationClick = (notification: Notification) => {
    // 1. Mark as read (optimistic)
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notification._id ? { ...n, isRead: true } : n
      )
    );
     // Check if any unread left
    const remainingUnread = notifications.filter(n => !n.isRead && n._id !== notification._id).length > 0;
    setHasUnread(remainingUnread);

    // 2. Emit mark_read to server
    if (socket && isConnected) {
      socket.emit("mark_read", { id: notification._id });
    }

    // 3. Navigate if type is REPORT
    setIsOpen(false);
    if (notification.type === 'NEW_REPORT' || notification.type === 'REPORT_UPDATE') {
        // Assuming metadata contains reportId. If not, we might need to rely on something else.
        // For now, let's assume if it is a report notification, it should ideally have data.
        const reportId = notification.metadata?.reportId || notification.metadata?.id;
        if (reportId) {
             router.push(`/dashboard/reports/${reportId}`);
        } else {
             // Fallback to reports list
             router.push(`/dashboard/reports`);
        }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
          <span className="sr-only">{t("SETTINGS.NOTIFICATIONS")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-semibold">{t("SETTINGS.NOTIFICATIONS")}</h4>
          {isConnected ? (
             <span className="h-2 w-2 rounded-full bg-green-500" title="Connected" />
          ) : (
             <span className="h-2 w-2 rounded-full bg-red-500" title="Disconnected" />
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  className={`flex flex-col items-start gap-1 border-b p-4 text-left transition-colors hover:bg-muted/50 ${
                    !notification.isRead ? "bg-muted/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full justify-between">
                    <span className="font-semibold text-sm">
                      {notification.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

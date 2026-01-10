"use client";

import { useSocketContext } from "@/contexts/SocketContext";
import { format } from "date-fns";
import { Loader2, Bell, Check, MapPin, AlertTriangle, Shield, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotificationPage() {
  const { socket } = useSocketContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=50");
      return data.data; // Assuming API structure
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      // Assuming there's an endpoint for this, or simulate by loop
      // For now, implementing iterative or finding if API supports bulk
      // If not supported, we might just loop current list
      // For this MVP, let's assume individual Mark Read or just skip bulk for now
      // Or loop through unread
      const unread = notifications?.filter((n: any) => !n.isRead) || [];
      await Promise.all(unread.map((n: any) => api.patch(`/notifications/${n._id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success(t("NOTIFICATIONS.MARK_READ_SUCCESS"));
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }

    if (notification.type === "SOS" || notification.type === "NEW_REPORT") {
      if (notification.data?.reportId) {
        router.push(`/dashboard/reports/${notification.data.reportId}`);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "SOS":
      case "NEW_REPORT":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "ACTIVITY":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "SYSTEM":
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("NOTIFICATIONS.TITLE")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("NOTIFICATIONS.SUBTITLE")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || !notifications?.some((n: any) => !n.isRead)}
          >
            {t("NOTIFICATIONS.MARK_ALL_READ")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <ScrollArea className="h-[600px] p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-4">
              <Bell className="h-12 w-12 opacity-20" />
              <p>{t("NOTIFICATIONS.NO_NOTIFICATIONS")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications?.map((notification: any) => (
                <div
                  key={notification._id}
                  className={cn(
                    "group relative flex gap-4 rounded-lg p-4 transition-all hover:bg-accent/50 border",
                    !notification.isRead ? "bg-accent/10 border-blue-200 dark:border-blue-800" : "border-transparent"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm",
                    !notification.isRead && "ring-2 ring-blue-500/20"
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("font-medium leading-none", !notification.isRead && "text-blue-600 dark:text-blue-400")}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(notification.createdAt), "PPp")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.body}
                    </p>
                  </div>
                  
                  {!notification.isRead && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notification._id);
                        }}
                      >
                         <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {!notification.isRead && (
                    <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

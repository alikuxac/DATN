"use client";

import { useEffect } from "react";
import { useSocketContext } from "@/contexts/SocketContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function PreferenceSync() {
  const { socket } = useSocketContext();
  const { setTheme } = useTheme();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    if (!socket) return;

    const handlePreferencesUpdated = (data: { theme: string; language: string }) => {
      console.log("Received preference update:", data);
      
      if (data.theme) {
        setTheme(data.theme as any);
      }
      
      if (data.language) {
        setLanguage(data.language as any);
      }
      
      toast.info("Preferences synced from another device");
    };

    socket.on("preferences_updated", handlePreferencesUpdated);

    return () => {
      socket.off("preferences_updated", handlePreferencesUpdated);
    };
  }, [socket, setTheme, setLanguage]);

  return null;
}

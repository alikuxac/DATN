"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // using js-cookie client side to check availability
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SocketProvider, useSocketContext } from "@/contexts/SocketContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    // Small delay to ensure cookies are set if coming from login
    const checkAuth = () => {
      const token = Cookies.get("accessToken");
      console.log('Dashboard layout auth check:', { token: !!token });
      
      if (!token) {
        router.replace("/auth/login");
      } else {
        setAuthorized(true);
      }
      setIsChecking(false);
    };

    // Add small delay to prevent race condition with cookie setting
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [router]);

  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleNewSos = (data: any) => {
      const isGuest = data.source === 'GUEST';
      const severity = data.severity || 'high';

      let title = '';
      let description = '';
      let toastFn = toast.error; // Default to error/critical

      // 1. Determine Title & Level
      if (isGuest) {
        title = '🆘 GUEST SOS (KHẨN CẤP)';
        toastFn = toast.error;
      } else {
        if (severity === 'critical') {
            title = '🆘 USER SOS (KHẨN CẤP)';
            toastFn = toast.error;
        } else if (severity === 'high') {
            title = '⚠️ CẢNH BÁO CAO';
            toastFn = toast.warning;
        } else {
            title = 'ℹ️ YÊU CẦU HỖ TRỢ';
            toastFn = toast.info;
        }
      }

      // 2. Determine Content
      if (isGuest) {
        description = `Khách vãng lai cần cứu trợ! SĐT: ${data.notes?.match(/Guest Phone: ([\d+]+)/)?.[1] || 'N/A'}`;
      } else {
        description = `Người dùng ${data.user?.firstName || 'ẩn danh'} cần hỗ trợ (${severity.toUpperCase()}).`;
      }

      // 3. Show Toast
      toastFn(title, {
        description: `${description}\nLoại: ${data.type}`,
        duration: severity === 'critical' || isGuest ? 20000 : 10000, 
        action: {
          label: 'Xem Bản Đồ',
          onClick: () => router.push(`/dashboard/map?reportId=${data._id}`)
        }
      });
    };

    socket.on('new_sos', handleNewSos);

    return () => {
      socket.off('new_sos', handleNewSos);
    };
  }, [socket, router]);
  useEffect(() => {
    if (authorized && user?.data) {
        const { email, mobileNumber } = user.data.verification || {};
        // Check if either is missing/false. 
        // Note: user.data.verification might be undefined if not populated, handling that safely.
        if (!email || !mobileNumber) {
             toast.warning(t("COMMON.UNVERIFIED_ACCOUNT_WARNING") || "Your account is not fully verified.", {
                description: t("COMMON.UNVERIFIED_ACCOUNT_DESC") || "Please verify your email and phone number in Profile settings.",
                action: {
                    label: t("PROFILE.TITLE") || "Profile",
                    onClick: () => router.push("/dashboard/profile")
                },
                duration: 8000, // Show for a bit longer
             });
        }
    }
  }, [authorized, user?.data, router, t]);

  if (isChecking || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

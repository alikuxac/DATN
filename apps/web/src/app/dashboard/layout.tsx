"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // using js-cookie client side to check availability
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SocketProvider } from "@/contexts/SocketContext";
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

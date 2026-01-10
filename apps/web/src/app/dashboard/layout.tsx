"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // using js-cookie client side to check availability
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SocketProvider } from "@/contexts/SocketContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

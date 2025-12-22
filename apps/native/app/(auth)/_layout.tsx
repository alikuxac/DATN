import { Stack } from "expo-router";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AuthLayout() {
  return (
    <>
      <AuthGuard /> {/* 👈 Nhúng ở đây để chặn user đã login chui vào lại */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

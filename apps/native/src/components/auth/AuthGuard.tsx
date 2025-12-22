import { useEffect } from "react";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useAppSelector } from "@/store/hooks";

export const AuthGuard = () => {
  const { token } = useAppSelector((state) => state.app);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState(); // Check xem navigation đã load xong chưa

  useEffect(() => {
    if (!navigationState?.key) return; // Chờ Navigation sẵn sàng

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      // Chưa login mà không ở trang auth -> Đá về sign-in
      router.replace("/(auth)/sign-in");
    } else if (token && inAuthGroup) {
      // Đã login mà lại vào trang auth -> Đá về tabs
      router.replace("/(tabs)");
    }
  }, [token, segments, navigationState?.key]);

  return null; // Component này không render giao diện, chỉ chạy logic
};

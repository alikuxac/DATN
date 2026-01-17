import { useEffect } from "react";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useAppSelector } from "@/store/hooks";

export function useAuthRedirect() {
  const { token, isFirstLaunch } = useAppSelector((state) => state.app);
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Chỉ chạy khi navigation đã ready
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    // Logic Redirect
    if (!token && !inAuthGroup && !isFirstLaunch) {
      router.replace("/(auth)/sign-in");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [token, segments, isFirstLaunch, rootNavigationState?.key]);
}

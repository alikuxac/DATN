import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAppSelector } from "@/store/hooks";

export function useAuthRedirect() {
  const { token, isFirstLaunch } = useAppSelector((state) => state.app);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    // Nếu App chưa load xong state (thường redux-persist sẽ handle việc này, 
    // nhưng ở đây ta giả định token load đồng bộ hoặc đã xong)

    // Logic Redirect
    if (!token && !inAuthGroup && !isFirstLaunch) {
      // 1. Nếu chưa login, không ở trang auth, và không phải lần đầu vào app
      // -> Đá về Sign In
      router.replace("/(auth)/sign-in");
    } else if (token && inAuthGroup) {
      // 2. Nếu đã login mà lại lò dò vào trang auth
      // -> Đá về Tabs
      router.replace("/(tabs)");
    }
  }, [token, segments, isFirstLaunch]);
}

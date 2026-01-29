import { useEffect } from "react";
import { useRouter, useRootNavigationState } from "expo-router";
import { useAppSelector } from "@/store/hooks";

export function useAuthRedirect() {
  const { token, isFirstLaunch } = useAppSelector((state) => state.app);
  const rootNavigationState = useRootNavigationState();

  let router: any;
  try {
    router = useRouter();
  } catch (e) {
    // router not ready
  }

  // Helper to find leaf route
  const getActiveRouteName = (state: any): string | null => {
    if (!state || typeof state.index !== 'number') return null;
    const route = state.routes[state.index];
    if (route.state) return getActiveRouteName(route.state);
    return route.name;
  };

  useEffect(() => {
    // 1. Check if navigation is ready (key exists)
    if (!rootNavigationState?.key) return;

    const activeRouteName = getActiveRouteName(rootNavigationState);

    // If activeRouteName is null, we don't know where we are yet.
    if (!activeRouteName) return;

    // Check if we are in an Auth Screen
    const authScreens = ['sign-in', 'sign-up', 'forgot-password', 'guest-sos'];
    const isAuthScreen = authScreens.includes(activeRouteName);

    // Also check for (auth) group just in case
    const inAuthGroup = isAuthScreen || activeRouteName === '(auth)';

    console.log(`[AuthRedirect] State: ${token ? 'Logged In' : 'Logged Out'}, Route: ${activeRouteName}`);

    // 3. Logic Redirect
    if (!router) return;

    const task = setTimeout(() => {
      if (!token && !inAuthGroup && !isFirstLaunch) {
        router.replace("/(auth)/sign-in");
      } else if (token && inAuthGroup) {
        router.replace("/(tabs)");
      }
    }, 100);

    return () => clearTimeout(task);
  }, [token, isFirstLaunch, rootNavigationState]);
}

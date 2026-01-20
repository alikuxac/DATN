import { useRouter, useRootNavigationState } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import SignInScreen from "./(auth)/sign-in";
import SignUpScreen from "./(auth)/sign-up";

export default function HomeScreen() {
  const { token, isFirstLaunch } = useAppSelector((state) => state.app);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // Handle Navigation in Effect
  useEffect(() => {
    // Check navigation readiness
    if (!rootNavigationState?.key) return;

    if (token) {
      router.replace("/(tabs)/map");
    }
  }, [token, rootNavigationState?.key]);

  // Nếu chưa login
  if (!token) {
    // Lần đầu mở app → Sign Up
    if (isFirstLaunch) {
      return <SignUpScreen />;
    }
    // Các lần sau → Sign In
    return <SignInScreen />;
  }

  // Đã login → Hiển thị loading trong khi redirect
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
      <ActivityIndicator size="small" color="#0000ff" />
    </View>
  );
}

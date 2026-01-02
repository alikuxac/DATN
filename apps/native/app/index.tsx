import { useAppSelector } from "@/store/hooks";
import { Redirect } from "expo-router";
import SignInScreen from "./(auth)/sign-in";
import SignUpScreen from "./(auth)/sign-up";

export default function HomeScreen() {
  const { token, isFirstLaunch } = useAppSelector((state) => state.app);

  // Nếu chưa login
  if (!token) {
    // Lần đầu mở app → Sign Up
    if (isFirstLaunch) {
      return <SignUpScreen />;
    }
    // Các lần sau → Sign In
    return <SignInScreen />;
  }

  // Đã login → Redirect về map
  return <Redirect href="/(tabs)/map" />;
}

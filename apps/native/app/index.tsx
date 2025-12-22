import { useAppSelector } from "@/store/hooks";
import SignUpScreen from "./(auth)/sign-up";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  const { token } = useAppSelector((state) => state.app);

  if (!token) return <SignUpScreen />;

  return <Redirect href="/(tabs)/map" />;
}

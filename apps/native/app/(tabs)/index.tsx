import { Redirect } from "expo-router";

export default function TabIndex() {
  // Khi user vào /(tabs), tự động chuyển sang /(tabs)/map
  return <Redirect href="/(tabs)/map" />;
}

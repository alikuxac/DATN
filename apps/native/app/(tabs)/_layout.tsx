import { Tabs } from "expo-router";

import CustomTabBar from "../../src/navigation/components/CustomTabBar";
import CustomScreenHeader from "@/navigation/components/ScreenHeader";

export default function TabLayout() {

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <CustomScreenHeader {...props} />,
      }}
    >
      {/* 1. Index (Hidden) */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      {/* 2. Map */}
      <Tabs.Screen
        name="map"
        options={{
          headerShown: false,
          title: "Map",
        }}
      />

      {/* 3. Reports */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          headerLeft: () => null,
          headerRight: () => null,
        }}
      />

      {/* 4. Account */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerLeft: () => null,
          headerRight: () => null,
        }}
      />
    </Tabs>
  );
}

import React from "react";
import { Redirect, Tabs } from "expo-router";

import { useAppSelector } from "@/store/hooks";

import CustomTabBar from "../../src/navigation/components/CustomTabBar";
import CustomScreenHeader from "@/navigation/components/ScreenHeader";

export default function TabLayout() {

  return (
    <Tabs
      // Gắn CustomTabBar vào đây
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
          title: "Map", // CustomTabBar sẽ dùng cái này làm label (hoặc dùng translation key)
        }}
      />

      {/* 3. Reports */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
        }}
      />

      {/* 4. Account */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
        }}
      />
    </Tabs>
  );
}

import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Text, View, Platform } from "react-native"; // Dùng Text của RN để dễ control style
import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useAppSelector } from "@/store/hooks";

export default function TabLayout() {
  const { t } = useTranslation();

  const { token } = useAppSelector(state => state.app);
  if (!token) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // 1. Cấu hình thanh Tab Bar
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9", // slate-100
          height: Platform.OS === "ios" ? 90 : 70, // Tăng chiều cao để chứa cả Icon + Text thoải mái
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 12, // Căn chỉnh padding đáy
          elevation: 0,
          shadowOpacity: 0,
        },

        // 2. Ép buộc vị trí Label luôn nằm dưới Icon (Quan trọng)
        tabBarLabelPosition: "below-icon",

        // Màu active/inactive
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
      }}
    >
      {/* 1. Ẩn Route Index khỏi thanh Tab Bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // 👈 Quan trọng: Không hiện icon cho route này
        }}
      />

      {/* --- TAB 1: MAP --- */}
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          // Custom Label: Xử lý Bold khi Focused
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                color,
                fontSize: 12,
                marginTop: 4,
                // 👇 Logic In đậm tại đây
                fontFamily: focused ? "SourceSans3-Bold" : "SourceSans3-Medium",
                fontWeight: focused ? "700" : "500",
              }}
            >
              {t("MAP") || "Map"} {/* Dùng translate nếu cần */}
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Icon
              name="MapPin"
              className={`w-6 h-6 ${focused ? "text-[#2563eb]" : "text-[#94a3b8]"}`}
            />
          ),
        }}
      />

      {/* --- TAB 2: REPORTS --- */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                color,
                fontSize: 12,
                marginTop: 4,
                fontFamily: focused ? "SourceSans3-Bold" : "SourceSans3-Medium",
                fontWeight: focused ? "700" : "500",
              }}
            >
              {t("REPORTS") || "Reports"}
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Icon
              name="FileText"
              className={`w-6 h-6 ${focused ? "text-[#2563eb]" : "text-[#94a3b8]"}`}
            />
          ),
        }}
      />

      {/* --- TAB 3: ACCOUNT --- */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                color,
                fontSize: 12,
                marginTop: 4,
                fontFamily: focused ? "SourceSans3-Bold" : "SourceSans3-Medium",
                fontWeight: focused ? "700" : "500",
              }}
            >
              {t("ACCOUNT") || "Account"}
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <Icon
              name="User"
              className={`w-6 h-6 ${focused ? "text-[#2563eb]" : "text-[#94a3b8]"}`}
            />
          ),
        }}
      />
    </Tabs>
  );
}

import "react-native-url-polyfill/auto";
import "@/config/global.css";
import "@/config/i18n";

import React, { useEffect } from "react";
import { StatusBar, View, LogBox } from "react-native";

LogBox.ignoreLogs([
  "line dasharray",
  "Request failed due to a permanent error: Canceled",
  "Reading from `value` during component render",
]);

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import {
  Stack,
  SplashScreen,
  useSegments,
  useRouter,
  useRootNavigationState,
} from "expo-router";

import { persistor, store } from "@/store";
import { useAppSelector } from "@/store/hooks";

import LoadingScreen from "@/components/LoadingScreen";
import { useColors } from "@/hooks/useColors";
import { useSocketNotification } from "@/hooks/useSocketNotification";
import { useLocationTracking } from "@/hooks/useUserLocation";
import { useExpoPushToken } from "@/hooks/useExpoPushToken";
import { usePreferencesSync } from "@/hooks/usePreferencesSync";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import InsetsHelper from "@/components/helpers/InsetsHelper";
import { LanguageHelper } from "@/components/helpers/LanguageHelper";
import { DialogProvider } from "@/components/ui/DialogProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PermissionGuard } from "@/components/PermissionGuard";
import { SystemAlertModal } from "@/components/SystemAlertModal";

SplashScreen.preventAutoHideAsync();

// ----------------------------------------------------------------------
// 1. Root Navigator & Logic (Đã gộp lại để fix lỗi Context)
// ----------------------------------------------------------------------
function RootNavigator() {
  const { token, theme } = useAppSelector((state) => state.app);
  const navigationState = useRootNavigationState();
  const colors = useColors();

  // B. Logic App (Socket, Location, Push Token, Preferences Sync)
  // Chỉ chạy các hook này khi Navigation đã sẵn sàng để tránh lỗi "No Navigation Context"
  const isNavigationReady = navigationState?.key;

  // Gọi hooks nhưng có điều kiện hoặc để hook tự handle null
  useExpoPushToken();
  usePreferencesSync(); // ← Sync preferences từ server khi app khởi động
  useAuthRedirect(); // ← Thêm Auth Redirect logic ở đây

  // Quan trọng: useSocketNotification có thể dùng navigation bên trong
  // Chúng ta truyền router hoặc check điều kiện bên trong hook
  const { socket, alertData, setAlertData, isConnected } = useSocketNotification();

  useLocationTracking(token);

  // C. Cấu hình Theme
  const navTheme = {
    ...DefaultTheme,
    dark: theme === "dark",
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.neutrals800,
      text: colors.foreground,
      border: colors.neutrals700,
      notification: colors.primary,
    },
  };

  // D. Render Giao diện
  return (
    <ThemeProvider value={navTheme}>
      {/* Các Helper & Modal toàn cục */}
      <InsetsHelper />
      <LanguageHelper />

      {/* Chỉ hiện Modal khi App đã load xong */}
      {isNavigationReady && (
        <SystemAlertModal
          visible={!!alertData}
          data={alertData}
          onClose={() => {
            const { FeedbackUtils } = require('@/utils/feedback');
            FeedbackUtils.stopSiren();
            setAlertData(null);
          }}
        />
      )}

      {/* Stack điều hướng chính */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",

          // 2. Cho phép vuốt cạnh trái để back (UX chuẩn)
          gestureEnabled: true,
          gestureDirection: "horizontal",

          // 3. Màu nền khi chuyển trang (tránh nháy trắng/đen)
          contentStyle: { backgroundColor: "#fff" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>

      {/* Socket Status Indicator */}
      <View
        className={`absolute w-3 h-3 rounded-full border border-white shadow-sm transition-all duration-300 ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
        style={{
          top: 50, // Avoid dynamic inset for now or use insets.top + 10
          right: 20,
          opacity: 0.8,
        }}
        pointerEvents="none"
      />
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------
// 2. Providers Wrapper (UI & Redux)
// ----------------------------------------------------------------------
const AppProviders = () => {
  const { theme } = useAppSelector((state) => state.app);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} className={theme === "dark" ? "dark" : ""}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <BottomSheetModalProvider>
          <SafeAreaProvider>
            <DialogProvider>
              <ToastProvider>
                {/* RootNavigator nằm trong cùng để tận dụng mọi Provider */}
                <RootNavigator />
              </ToastProvider>
            </DialogProvider>
          </SafeAreaProvider>
        </BottomSheetModalProvider>
      </View>
    </GestureHandlerRootView>
  );
};

// ----------------------------------------------------------------------
// 3. Export Default (Root Entry)
// ----------------------------------------------------------------------
export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PermissionGuard>
          <AppProviders />
        </PermissionGuard>
      </PersistGate>
    </Provider>
  );
}

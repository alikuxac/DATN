// app/_layout.tsx

import "react-native-url-polyfill/auto"; // 1. Polyfill luôn ở đầu
import "@/config/global.css";
import "@/config/i18n";

import React, { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { Stack, SplashScreen } from "expo-router"; // Dùng Stack của Expo Router

// Import từ code cũ của bạn
import { persistor, store } from "@/store";
import { useAppSelector } from "@/store/hooks";
import LoadingScreen from "@/components/LoadingScreen";
import { useColors } from "@/hooks/useColors";
import InsetsHelper from "@/components/helpers/InsetsHelper.tsx";
import { LanguageHelper } from "@/components/helpers/LanguageHelper.tsx";
import { DialogProvider } from "@/components/ui/DialogProvider.tsx";
import { ToastProvider } from "@/components/ui/ToastProvider.tsx";

// Ngăn màn hình splash ẩn đi cho đến khi load xong (tùy chọn)
SplashScreen.preventAutoHideAsync();

// Component con: Đã có Redux Context, có thể dùng hooks
const AppLayoutNav = () => {
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();

  // Tạo theme object cho React Navigation/Expo Router
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} className={theme === "dark" ? "dark" : ""}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />

        {/* Thay thế NavigationContainer bằng ThemeProvider */}
        <ThemeProvider value={navTheme}>
          <BottomSheetModalProvider>
            <SafeAreaProvider>
              <DialogProvider>
                <ToastProvider>
                  <InsetsHelper />
                  <LanguageHelper />

                  {/* Đây là nơi các screen (như index.tsx) được render */}
                  <Stack screenOptions={{ headerShown: false }} />
                </ToastProvider>
              </DialogProvider>
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </View>
    </GestureHandlerRootView>
  );
};

// Component cha: Chỉ chứa Provider
export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <AppLayoutNav />
      </PersistGate>
    </Provider>
  );
}

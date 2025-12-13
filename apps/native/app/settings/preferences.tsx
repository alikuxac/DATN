import React, { useCallback, useState, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme, setLanguage, Theme } from "@/store/slices/appSlice";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { apiService } from "@/services/api.service";
import { useFocusEffect } from "expo-router";
import { getDeviceLanguage } from "@/utils/getDeviceLanguage";
import { useToast } from "@/components/ui/ToastProvider";

// Định nghĩa kiểu dữ liệu cho Preferences từ API
interface UserPreferences {
  theme?: string;
  language?: string;
}

export default function PreferencesScreen() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.app);
  const colors = useColors();
  const { showError } = useToast();
  const systemScheme = useColorScheme();

  const [loading, setLoading] = useState(true);

  // Ref để lưu trữ timer debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isDarkMode =
    theme === "system" ? systemScheme === "dark" : theme === "dark";

  // Lấy preferences từ DB khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      fetchUserPreferences();
      // Cleanup timer khi unmount/blur
      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, [])
  );

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<{ data: UserPreferences }>(
        "/shared/user/preferences"
      );
      const prefs = response.data;

      // Đồng bộ dữ liệu từ Server về Redux/App nếu khác biệt
      if (prefs.theme && prefs.theme !== theme) {
        dispatch(setTheme(prefs.theme as Theme));
      }

      // Lưu ý: Logic language cần cẩn thận để tránh override nhầm system
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm gọi API update (Được debounce)
  const updatePreferencesApi = async (
    key: "theme" | "language",
    value: string
  ) => {
    // 1. Clear timer cũ nếu user bấm tiếp
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 2. Set timer mới (Debounce 1000ms = 1 giây)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log(`[API CALL] Updating ${key} to ${value}...`);
        await apiService.put("/shared/user/preferences/update", {
          [key]: value,
        });
      } catch (error) {
        console.error("Failed to update preferences:", error);
        showError(
          t("COMMON.ERROR"),
          t("COMMON.ERR_UPDATE_FAILED")
        );
      }
    }, 1000);
  };

  // Xử lý Theme
  const handleSetTheme = (newTheme: string) => {
    // 1. Optimistic Update: Cập nhật UI ngay lập tức
    dispatch(setTheme(newTheme as Theme));

    // 2. Gọi API update (qua debounce)
    updatePreferencesApi("theme", newTheme);
  };

  // Xử lý Language
  const handleSetLanguage = (langCode: string) => {
    let newLang = langCode;

    // Nếu chọn system, lấy ngôn ngữ máy để hiển thị
    if (langCode === "system") {
      newLang = getDeviceLanguage();
    }

    // 1. Optimistic Update
    dispatch(setLanguage(newLang as any));
    i18n.changeLanguage(newLang);

    // 2. Gọi API update
    updatePreferencesApi("language", newLang);
  };

  const languages = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", label: "English", flag: "🇺🇸" },
  ];

  const themes = [
    {
      code: "system",
      label: t("SETTINGS.THEME.SYSTEM"),
      icon: "Smartphone",
    },
    {
      code: "light",
      label: t("SETTINGS.THEME.LIGHT"),
      icon: "Sun",
    },
    {
      code: "dark",
      label: t("SETTINGS.THEME.DARK"),
      icon: "Moon",
    },
  ];

  const RenderOptionItem = ({
    label,
    isSelected,
    onPress,
    icon,
    flag,
    isLast,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {icon ? (
          <View
            style={[
              styles.iconBox,
              { backgroundColor: isDarkMode ? "#333" : "#f3f4f6" },
            ]}
          >
            <Icon name={icon} size={20} color={colors.foreground} />
          </View>
        ) : (
          <AppText style={{ fontSize: 24 }}>{flag}</AppText>
        )}
        <AppText style={{ fontSize: 16, color: colors.foreground }}>
          {label}
        </AppText>
      </View>
      {isSelected && <Icon name="Check" size={20} color={colors.primary} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 1. GIAO DIỆN (THEME) */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>
          {t("SETTINGS.PREFERENCES")}
        </AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {themes.map((item, index) => (
            <RenderOptionItem
              key={item.code}
              label={item.label}
              icon={item.icon}
              isSelected={theme === item.code}
              onPress={() => handleSetTheme(item.code)}
              isLast={index === themes.length - 1}
            />
          ))}
        </View>
      </View>

      {/* 2. NGÔN NGỮ (LANGUAGE) */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>
          {t("SETTINGS.LANGUAGE.TITLE")}
        </AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {languages.map((item, index) => (
            <RenderOptionItem
              key={item.code}
              label={item.label}
              flag={item.flag}
              isSelected={language === item.code}
              onPress={() => handleSetLanguage(item.code)}
              isLast={index === languages.length - 1}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

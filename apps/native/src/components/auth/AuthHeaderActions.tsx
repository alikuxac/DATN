import React from "react";
import { View, Pressable } from "react-native";
import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme, setLanguage } from "@/store/slices/appSlice";
import { LanguageCode } from "@/config/i18n";

/**
 * Component tái sử dụng cho toggle theme và language
 * Dùng trong các màn hình auth (sign-in, sign-up)
 */
export default function AuthHeaderActions() {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const { theme, language } = useAppSelector((state) => state.app);

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const handleToggleLanguage = () => {
    const newLanguage: LanguageCode = language === "en" ? "vi" : "en";
    dispatch(setLanguage(newLanguage));
    i18n.changeLanguage(newLanguage);
  };

  return (
    <View className="flex-row gap-3">
      {/* Toggle Language */}
      <Pressable
        onPress={handleToggleLanguage}
        className="w-10 h-10 rounded-full bg-neutrals100 dark:bg-neutrals800 items-center justify-center active:opacity-70"
      >
        <Icon
          name="Languages"
          className="w-5 h-5 text-neutrals700 dark:text-neutrals300"
        />
      </Pressable>

      {/* Toggle Theme */}
      <Pressable
        onPress={handleToggleTheme}
        className="w-10 h-10 rounded-full bg-neutrals100 dark:bg-neutrals800 items-center justify-center active:opacity-70"
      >
        <Icon
          name={theme === "dark" ? "Sun" : "Moon"}
          className="w-5 h-5 text-neutrals700 dark:text-neutrals300"
        />
      </Pressable>
    </View>
  );
}

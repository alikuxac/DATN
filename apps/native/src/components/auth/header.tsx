import React from "react";
import { View, Image } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "../ui";
import { expo } from '../../../app.json';
import AuthHeaderActions from "./AuthHeaderActions";

export default function AuthHeader() {
  const { t } = useTranslation();

  return (
    <View className="mb-8">
      {/* Actions Top Right */}
      <View className="items-end mb-4">
        <AuthHeaderActions />
      </View>

      {/* Logo & Title Center */}
      <View className="items-center">
        <View className="w-24 h-24 bg-white dark:bg-neutrals900 rounded-3xl items-center justify-center mb-6 shadow-sm border border-neutrals100 dark:border-neutrals800">
          <Image 
            source={require('../../../assets/icon.png')} 
            className="w-20 h-20"
            resizeMode="contain"
          />
        </View>
        <AppText raw variant="heading1" weight="bold" className="mb-1 text-center">
          {expo.name}
        </AppText>
        <AppText raw variant="body" color="muted" align="center">
          {t('COMMON.APP_TAGLINE')}
        </AppText>
      </View>
    </View>
  );
}

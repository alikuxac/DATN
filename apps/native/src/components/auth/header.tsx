import React from "react";
import { View, Image } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "../ui";
import { expo } from '../../../app.json';
import AuthHeaderActions from "./AuthHeaderActions";

export default function AuthHeader() {
  const { t } = useTranslation();

  return (
    <View className="mb-6">
      {/* Actions Top Right */}
      <View className="items-end mb-2">
        <AuthHeaderActions />
      </View>

      {/* Hero Image & Title Center */}
      <View className="items-center">
        <Image 
          source={require('../../../assets/flood_relief_hero.jpg')} 
          className="w-full h-40 rounded-2xl mb-4"
          resizeMode="cover"
        />
        <AppText raw variant="heading2" weight="bold" className="text-center text-primary dark:text-blue-400">
          Hệ thống Cứu trợ Lũ lụt
        </AppText>
        <AppText raw variant="body" color="muted" align="center" className="mt-1">
          Kết nối cộng đồng - Hỗ trợ kịp thời
        </AppText>
      </View>
    </View>
  );
}

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";

import { useColors } from "@/hooks/useColors";
import { ApiError, apiService } from "@/services/api.service";
import { ENUM_USER_ROLE, IResponse, IUserProfileReponse } from "@repo/shared";
import { useToast } from "@/components/ui/ToastProvider";
import { ProfileCard } from "@/components/account/ProfileCard";
import { VolunteerStatusCard } from "@/components/account/VolunteerStatusCard";

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();
  const systemScheme = useColorScheme();
  const { showSuccess, showError } = useToast();

  const isDarkMode = theme === "dark";
  const activeColor = "#22c55e";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingVolunteer, setIsUpdatingVolunteer] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const isRescueEnabled =
    userData?.role === ENUM_USER_ROLE.VOLUNTEER || userData?.isRescueMode === true;

  // Load data mỗi khi màn hình được focus (để cập nhật dữ liệu mới nếu vừa sửa ở settings về)
  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.get<IResponse<IUserProfileReponse>>(
        "/shared/user/profile"
      );
      setUserData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateVolunteer = async (newValue: boolean) => {
    if (!userData) return;

    setIsUpdatingVolunteer(true);
    try {
      const response = await apiService.put<any>(
        "/shared/user/volunteer/update", 
        {}
      );
      showSuccess(t("COMMON.SUCCESS", t("PROFILE.UPDATE_VOLUNTEER_SUCCESS")));
      await fetchUserProfile();
    } catch (error) {
      console.error("Update volunteer error:", error);

      const message =
        error instanceof ApiError
          ? error.message
          : t("PROFILE.UPDATE_VOLUNTEER_FAILED");
      showError(t("COMMON.ERROR"), message);
    } finally {
      setIsUpdatingVolunteer(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "dark-content" : "light-content"}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. THẺ HỒ SƠ */}
        <ProfileCard
          userData={userData}
          theme={theme}
          colors={colors}
          t={t}
        />

        {/* 2. TRẠNG THÁI HOẠT ĐỘNG (Ví dụ: Volunteer Mode) */}
        <VolunteerStatusCard
          isRescueEnabled={isRescueEnabled}
          userData={userData}
          isUpdatingVolunteer={isUpdatingVolunteer}
          updateVolunteer={updateVolunteer}
          colors={colors}
          activeColor={activeColor}
          t={t}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16 },
});

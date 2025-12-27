import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Platform,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";

import { AppText, Icon, Avatar, Switch } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { ApiError, apiService } from "@/services/api.service";
import { ENUM_USER_ROLE, IResponse, IUserProfileReponse } from "@repo/shared";
import { useToast } from "@/components/ui/ToastProvider";

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
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.profileHeader}>
            <Avatar
              text={`${userData?.firstName} ${userData?.lastName}`}
              size="xl"
              className="bg-blue-100"
              textClassName="text-blue-600 text-2xl"
            />
            <View style={styles.profileNameContainer}>
              <AppText
                style={[styles.profileName, { color: colors.foreground }]}
              >
                {userData?.firstName} {userData?.lastName}
              </AppText>

              <View style={styles.badgesRow}>
                {/* Role Badge */}
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        theme === "dark" ? "rgba(37, 99, 235, 0.2)" : "#dbeafe",
                    },
                  ]}
                >
                  <AppText style={[styles.badgeText, { color: "#2563eb" }]}>
                    {userData?.role?.toUpperCase()}
                  </AppText>
                </View>

                {/* Verification Badge */}
                {userData?.verification?.email && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "#dcfce7", marginLeft: 8 },
                    ]}
                  >
                    <Icon
                      name="Check"
                      size={12}
                      color="#16a34a"
                      style={{ marginRight: 4 }}
                    />
                    <AppText style={[styles.badgeText, { color: "#16a34a" }]}>
                      VERIFIED
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Thông tin chi tiết (Read-only) */}
          <View style={styles.infoContainer}>
            <InfoRow label="Email" value={userData?.email} colors={colors} />
            <InfoRow
              label={t("PROFILE.LABEL_PHONE")}
              value={userData?.phone}
              colors={colors}
              placeholder={t("PROFILE.VALUE_NO_PHONE")}
            />
            <InfoRow
              label={t("PROFILE.LABEL_GENDER")}
              value={
                userData?.gender
                  ? userData.gender.charAt(0).toUpperCase() +
                    userData.gender.slice(1)
                  : ""
              }
              colors={colors}
              placeholder={t("PROFILE.GENDER_OPTIONS.OTHER")}
            />
          </View>
        </View>

        {/* 2. TRẠNG THÁI HOẠT ĐỘNG (Ví dụ: Volunteer Mode) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isRescueEnabled
                ? "rgba(34, 197, 94, 0.05)"
                : colors.card, // Tint xanh nhẹ khi bật
              borderColor: isRescueEnabled ? activeColor : colors.border, // Viền xanh khi bật
              borderWidth: 1, // Đảm bảo viền hiện rõ
              paddingVertical: 16,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            {/* Phần Icon + Text */}
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 12,
                paddingRight: 10,
              }}
            >
              {/* Icon minh hoạ (Tuỳ chỉnh theo bộ icon bạn dùng) */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isRescueEnabled
                      ? activeColor
                      : colors.neutrals200,
                  },
                ]}
              >
                <Icon
                  name="Ambulance" // Hoặc "Shield", "HeartHandshake"
                  size={24}
                  color={isRescueEnabled ? "#fff" : colors.neutrals500}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <AppText
                    style={[styles.cardTitle, { color: colors.foreground }]}
                  >
                    {t("PROFILE.VOLUNTEER_MODE", "Chế độ Cứu hộ")}
                  </AppText>

                  {/* Badge nhỏ nếu là Admin đang bật mode */}
                  {userData?.role === "ADMIN" && isRescueEnabled && (
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 6,
                        borderRadius: 4,
                      }}
                    >
                      <AppText
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        ADMIN
                      </AppText>
                    </View>
                  )}
                </View>

                <AppText
                  style={{
                    fontSize: 13,
                    color: colors.neutrals400,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                >
                  {isRescueEnabled
                    ? t(
                        "PROFILE.VOLUNTEER_ON_DESC",
                        "Bạn đang nhận thông báo SOS. Hãy sẵn sàng!"
                      )
                    : t(
                        "PROFILE.VOLUNTEER_DESC",
                        "Bật để nhận thông báo cứu trợ xung quanh bạn."
                      )}
                </AppText>
              </View>
            </View>

            {/* Phần Switch hoặc Loading */}
            <View>
              {isUpdatingVolunteer ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={isRescueEnabled}
                  onValueChange={updateVolunteer}
                  
                  trackColor={{ false: colors.neutrals200, true: activeColor }}
                  thumbColor={"#fff"}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Component con hiển thị dòng thông tin read-only
const InfoRow = ({ label, value, placeholder = "---", colors }: any) => (
  <View style={{ marginBottom: 12 }}>
    <AppText style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>
      {label}
    </AppText>
    <AppText
      style={{
        fontSize: 16,
        fontWeight: "500",
        color: value ? colors.foreground : colors.neutrals400,
      }}
    >
      {value || placeholder}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight! + 10 : 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "SourceSans3-Bold",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { padding: 16 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileNameContainer: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  badgesRow: { flexDirection: "row", alignItems: "center" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  infoContainer: { marginTop: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20, // Tròn
    alignItems: "center",
    justifyContent: "center",
  },
});

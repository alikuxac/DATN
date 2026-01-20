import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { AppText, Switch, Icon } from "@/components/ui";

interface VolunteerStatusCardProps {
  isRescueEnabled: boolean;
  userData: any;
  isUpdatingVolunteer: boolean;
  updateVolunteer: (newValue: boolean) => void;
  colors: any;
  activeColor: string;
  t: any;
  theme: string;
  disabled?: boolean;
}

export const VolunteerStatusCard = ({
  isRescueEnabled,
  userData,
  isUpdatingVolunteer,
  updateVolunteer,
  colors,
  activeColor,
  t,
  theme,
  disabled
}: VolunteerStatusCardProps) => {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isRescueEnabled
            ? (theme === 'dark' ? "rgba(34, 197, 94, 0.1)" : "#ecfdf5") // Explicit light green for Light Mode
            : colors.card,
          borderColor: isRescueEnabled ? activeColor : colors.border,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        {/* Phần Icon + Text */}
        <View style={styles.leftContainer}>
          {/* Icon minh hoạ */}
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isRescueEnabled
                  ? activeColor
                  : theme === 'dark' ? colors.neutrals200 : '#f3f4f6', // Light gray for disabled in light mode
              },
            ]}
          >
            <Icon
              name="Ambulance"
              size={24}
              color={isRescueEnabled ? "#fff" : colors.neutrals500}
            />
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <AppText style={[styles.cardTitle, { color: colors.foreground }]}>
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
                  <AppText style={styles.adminBadgeText}>ADMIN</AppText>
                </View>
              )}
            </View>

            <AppText style={[styles.description, { color: colors.neutrals100 }]}>
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
              disabled={disabled}
              value={isRescueEnabled}
              onValueChange={updateVolunteer}
              trackColor={{ false: colors.neutrals200, true: activeColor }}
              thumbColor={"#fff"}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    paddingRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  adminBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});

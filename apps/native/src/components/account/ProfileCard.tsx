import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { AppText, Avatar, Icon } from "@/components/ui";
import { InfoRow } from "./InfoRow";

interface ProfileCardProps {
  userData: any;
  theme: string;
  colors: any;
  t: any;
}

export const ProfileCard = ({ userData, theme, colors, t }: ProfileCardProps) => {
  return (
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
          <AppText style={[styles.profileName, { color: colors.foreground }]}>
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

            {/* Email Verification Badge */}
            {userData?.verification?.email ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "#dcfce7", marginLeft: 8 },
                ]}
              >
                <Icon
                  name="Mail"
                  size={12}
                  color="#16a34a"
                  style={{ marginRight: 4 }}
                />
                <AppText style={[styles.badgeText, { color: "#16a34a" }]}>
                  VERIFIED
                </AppText>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "#fee2e2", marginLeft: 8 },
                ]}
              >
                <Icon
                  name="Mail"
                  size={12}
                  color="#dc2626"
                  style={{ marginRight: 4 }}
                />
                <AppText style={[styles.badgeText, { color: "#dc2626" }]}>
                  UNVERIFIED
                </AppText>
              </View>
            )}
            
             {/* Mobile Verification Badge */}
            {userData?.verification?.mobileNumber ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "#dcfce7", marginLeft: 4 },
                ]}
              >
                <Icon
                  name="Phone"
                  size={12}
                  color="#16a34a"
                  style={{ marginRight: 4 }}
                />
                 <AppText style={[styles.badgeText, { color: "#16a34a" }]}>
                  VERIFIED
                </AppText>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "#fee2e2", marginLeft: 4 },
                ]}
              >
                <Icon
                  name="Phone"
                  size={12}
                  color="#dc2626"
                  style={{ marginRight: 4 }}
                />
                <AppText style={[styles.badgeText, { color: "#dc2626" }]}>
                  UNVERIFIED
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
  );
};

const styles = StyleSheet.create({
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
});

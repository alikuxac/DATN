import React from "react";
import { useTranslation } from "react-i18next";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";

export interface SessionData {
  _id: string;
  deviceName: string;
  os: string;
  ip: string;
  lastActiveAt: string;
  isCurrent: boolean;
  platform: string;
}

interface SessionItemProps {
  session: SessionData;
  isCurrent: boolean;
  onRevoke: (id: string, name: string) => void;
}

export const SessionItem = ({ session, isCurrent, onRevoke }: SessionItemProps) => {
  const { t } = useTranslation();
  const colors = useColors();

  const getDeviceIcon = (session: SessionData) => {
    const platform = session.platform?.toUpperCase();
    
    if (platform === "MOBILE") return "Smartphone";
    if (platform === "WEB") return "Monitor";
    return "Globe";
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")} • ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isCurrent ? colors.primary : colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.sessionRow}>
        {/* Icon Box */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isCurrent
                ? "rgba(34, 197, 94, 0.1)"
                : colors.background,
            },
          ]}
        >
          <Icon
            name={getDeviceIcon(session) as any}
            size={24}
            color={isCurrent ? "#22c55e" : colors.neutrals500}
          />
        </View>

        {/* Info Text */}
        <View style={{ flex: 1 }}>
          <AppText style={[styles.deviceName, { color: colors.foreground }]}>
            {session.deviceName || t("SECURITY.DEVICE_UNKNOWN")}
          </AppText>
          <View style={styles.metaRow}>
            {/* Hiển thị OS và IP */}
            <AppText style={{ color: colors.neutrals500, fontSize: 12 }}>
              {(session.os && session.os !== "Unknown") ? session.os : (session.platform || t("SECURITY.OS_UNKNOWN"))} •{" "}
              {session.ip || t("SECURITY.IP_UNKNOWN")}
            </AppText>
          </View>
          <AppText
            style={{ color: colors.neutrals400, fontSize: 11, marginTop: 2 }}
          >
            {isCurrent
              ? t("SECURITY.STATUS_ONLINE")
              : t("SECURITY.STATUS_ACTIVE_AT", {
                  time: formatTime(session.lastActiveAt),
                })}
          </AppText>
        </View>

        {/* Action Button */}
        {isCurrent ? (
          <View style={styles.badge}>
            <View style={styles.activeDot} />
            <AppText style={styles.badgeText}>Online</AppText>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onRevoke(session._id, session.deviceName)}
            style={styles.revokeBtn}
          >
            <Icon name="LogOut" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16 },
  sessionRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: { fontWeight: "600", fontSize: 15, marginBottom: 2 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22c55e",
  },
  badgeText: { color: "#22c55e", fontSize: 11, fontWeight: "bold" },
  revokeBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
});

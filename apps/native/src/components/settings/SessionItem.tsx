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
  xForwardedForIP?: string;
  lastActiveAt: string;
  isCurrent: boolean;
  platform: string;
  status?: string; // "ACTIVE" | "REVOKED"
}

interface SessionItemProps {
  session: SessionData;
  isCurrent: boolean;
  onRevoke: (id: string, name: string) => void;
}

export const SessionItem = ({ session, isCurrent, onRevoke }: SessionItemProps) => {
  const { t } = useTranslation();
  const colors = useColors();

  const isRevoked = session.status === "REVOKED";
  // Ưu tiên xForwardedForIP
  const displayIP = session.xForwardedForIP || session.ip || t("SECURITY.IP_UNKNOWN");

  const getDeviceIcon = (session: SessionData) => {
    const platform = session.platform?.toUpperCase();
    
    if (platform === "MOBILE") return "Smartphone";
    if (platform === "WEB") return "Monitor";
    return "Globe";
  };
//...
// (No changes to formatTime are needed, but ensuring context matches for replace)
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
          opacity: isRevoked ? 0.6 : 1,
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
            color={isCurrent ? "#22c55e" : isRevoked ? colors.neutrals400 : colors.neutrals500}
          />
        </View>

        {/* Info Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText style={[styles.deviceName, { color: colors.foreground }]}>
              {session.deviceName || t("SECURITY.DEVICE_UNKNOWN")}
            </AppText>
            {isRevoked && (
              <View style={styles.revokedBadge}>
                <AppText style={styles.revokedText}>REVOKED</AppText>
              </View>
            )}
          </View>
          
          <View style={styles.metaRow}>
            {/* Hiển thị OS và IP */}
            <AppText style={{ color: colors.neutrals500, fontSize: 12 }}>
              {(session.os && session.os !== "Unknown") ? session.os : (session.platform || t("SECURITY.OS_UNKNOWN"))} •{" "}
              {displayIP}
            </AppText>
          </View>
          <AppText
            style={{ color: colors.neutrals400, fontSize: 11, marginTop: 2 }}
          >
            {isCurrent
              ? t("SECURITY.STATUS_ONLINE")
              : isRevoked 
                ? t("SECURITY.STATUS_REVOKED", "Đã đăng xuất")
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
        ) : !isRevoked ? (
          <TouchableOpacity
            onPress={() => onRevoke(session._id, session.deviceName)}
            style={styles.revokeBtn}
          >
            <Icon name="LogOut" size={18} color={colors.error} />
          </TouchableOpacity>
        ) : null}
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
  revokedBadge: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  revokedText: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "600",
  },
});

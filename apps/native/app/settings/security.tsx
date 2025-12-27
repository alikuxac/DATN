import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { apiService } from "@/services/api.service";

// Interface định nghĩa dữ liệu session
export interface SessionData {
  _id: string;
  deviceName: string;
  os: string;
  ip: string; // Khớp với DTO backend (@Expose() ip)
  lastActiveAt: string;
  isCurrent: boolean;
}

export default function SecurityScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);

  // Form đổi mật khẩu
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // --- TÁCH SESSION HIỆN TẠI VÀ SESSION KHÁC ---
  const currentSession = useMemo(
    () => sessions.find((s) => s.isCurrent),
    [sessions]
  );
  const otherSessions = useMemo(
    () => sessions.filter((s) => !s.isCurrent),
    [sessions]
  );

  // --- API ACTIONS ---
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await apiService.get<{ data: SessionData[] }>(
        "/shared/session/list"
      );
      setSessions(res.data);
    } catch (error) {
      console.error("Fetch sessions error:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      showError(t("COMMON.ERROR"), t("VALIDATION.PASSWORD_MISMATCH"));
      return;
    }
    try {
      setLoading(true);
      await apiService.post("/auth/change-password", form);
      showSuccess(t("COMMON.SUCCESS"), t("SECURITY.MSG_PASSWORD_CHANGED"));
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showError(t("COMMON.ERROR"), t("SECURITY.MSG_PASSWORD_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: string, deviceName: string) => {
    Alert.alert(
      t("SECURITY.REVOKE_TITLE", "Đăng xuất thiết bị?"),
      `Bạn có chắc muốn đăng xuất khỏi "${deviceName}" không?`,
      [
        { text: t("COMMON.CANCEL"), style: "cancel" },
        {
          text: t("COMMON.CONFIRM", "Đăng xuất"),
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.delete(`/shared/session/revoke/${sessionId}`);
              showSuccess(t("COMMON.SUCCESS"), "Đã đăng xuất thiết bị.");
              fetchSessions();
            } catch (err) {
              showError(t("COMMON.ERROR"), "Lỗi khi đăng xuất thiết bị.");
            }
          },
        },
      ]
    );
  };

  // --- HELPER RENDERS ---
  const getDeviceIcon = (os: string) => {
    const lowerOs = os?.toLowerCase() || "";
    if (lowerOs.includes("android") || lowerOs.includes("ios"))
      return "Smartphone";
    if (lowerOs.includes("mac") || lowerOs.includes("win")) return "Monitor";
    return "Globe"; // Cho trình duyệt lạ
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")} • ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Component hiển thị 1 dòng session
  const renderSessionItem = (session: SessionData, isCurrent: boolean) => (
    <View
      key={session._id}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isCurrent ? colors.primary : colors.border,
          borderWidth: isCurrent ? 1 : 1,
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
            name={getDeviceIcon(session.os)}
            size={24}
            color={isCurrent ? "#22c55e" : colors.neutrals500}
          />
        </View>

        {/* Info Text */}
        <View style={{ flex: 1 }}>
          <AppText style={[styles.deviceName, { color: colors.foreground }]}>
            {session.deviceName}
          </AppText>
          <View style={styles.metaRow}>
            {/* Hiển thị OS và IP */}
            <AppText style={{ color: colors.neutrals500, fontSize: 12 }}>
              {session.os} • {session.ip}
            </AppText>
          </View>
          <AppText
            style={{ color: colors.neutrals400, fontSize: 11, marginTop: 2 }}
          >
            {isCurrent
              ? "Đang hoạt động ngay bây giờ"
              : `Hoạt động: ${formatTime(session.lastActiveAt)}`}
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
            onPress={() => handleRevokeSession(session._id, session.deviceName)}
            style={styles.revokeBtn}
          >
            <Icon name="LogOut" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={loadingSessions}
          onRefresh={fetchSessions}
        />
      }
    >
      <View style={styles.content}>
        {/* --- PHẦN 1: ĐỔI MẬT KHẨU (Giữ nguyên logic cũ) --- */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Icon name="Lock" size={20} color={colors.primary} />
            <AppText
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              {t("SECURITY.CHANGE_PASSWORD")}
            </AppText>
          </View>
          <View style={styles.form}>
            <AppInput
              label={t("SECURITY.LABEL_CURRENT_PASSWORD")}
              value={form.oldPassword}
              onChangeText={(v) => setForm({ ...form, oldPassword: v })}
              secureTextEntry
              placeholder="••••••"
            />
            <AppInput
              label={t("SECURITY.LABEL_NEW_PASSWORD")}
              value={form.newPassword}
              onChangeText={(v) => setForm({ ...form, newPassword: v })}
              secureTextEntry
              placeholder="••••••"
            />
            <AppInput
              label={t("SECURITY.LABEL_CONFIRM_NEW_PASSWORD")}
              value={form.confirmPassword}
              onChangeText={(v) => setForm({ ...form, confirmPassword: v })}
              secureTextEntry
              placeholder="••••••"
            />
            <AppButton
              onPress={handleChangePassword}
              disabled={loading || !form.oldPassword}
              loading={loading}
              variant="outline"
              style={{ marginTop: 8 }}
            >
              {t("SECURITY.BTN_UPDATE_PASSWORD")}
            </AppButton>
          </View>
        </View>

        {/* --- PHẦN 2: QUẢN LÝ THIẾT BỊ --- */}
        <View style={[styles.section, { marginTop: 32 }]}>
          <View style={styles.headerRow}>
            <Icon name="ShieldCheck" size={20} color={colors.primary} />
            <AppText
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              {t("SECURITY.LABEL_ACTIVE_SESSIONS", "Thiết bị đăng nhập")}
            </AppText>
          </View>

          {loadingSessions && sessions.length === 0 ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : (
            <>
              {/* 2.1 THIẾT BỊ HIỆN TẠI */}
              {currentSession && (
                <View style={{ marginBottom: 20 }}>
                  <AppText
                    style={[styles.subTitle, { color: colors.neutrals500 }]}
                  >
                    THIẾT BỊ NÀY
                  </AppText>
                  {renderSessionItem(currentSession, true)}
                </View>
              )}

              {/* 2.2 CÁC THIẾT BỊ KHÁC */}
              {otherSessions.length > 0 && (
                <View>
                  <AppText
                    style={[styles.subTitle, { color: colors.neutrals500 }]}
                  >
                    THIẾT BỊ KHÁC ĐANG ĐĂNG NHẬP
                  </AppText>
                  <View style={{ gap: 10 }}>
                    {otherSessions.map((s) => renderSessionItem(s, false))}
                  </View>
                </View>
              )}

              {/* EMPTY STATE */}
              {!currentSession && otherSessions.length === 0 && (
                <AppText
                  style={{ color: colors.neutrals500, textAlign: "center" }}
                >
                  Không có dữ liệu thiết bị.
                </AppText>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },
  section: {},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  subTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  form: { gap: 16 },

  // SESSION CARD STYLES
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

  // BADGE & BUTTONS
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

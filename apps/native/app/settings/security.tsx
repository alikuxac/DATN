import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { apiService } from "@/services/api.service";

export default function SecurityScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      showError(
        t("COMMON.ERROR"),
        t("VALIDATION.PASSWORD_MISMATCH")
      );
      return;
    }

    try {
      setLoading(true);
      await apiService.post("/auth/change-password", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      showSuccess(
        t("COMMON.SUCCESS"),
        t("SECURITY.MSG_PASSWORD_CHANGED")
      );
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Failed to change password:", error);
      showError(t("COMMON.ERROR"), t("SECURITY.MSG_PASSWORD_ERROR"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Change Password Section */}
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
              disabled={loading || !form.oldPassword || !form.newPassword}
              loading={loading}
              variant="outline"
              style={{ marginTop: 8 }}
            >
              {t("SECURITY.BTN_UPDATE_PASSWORD")}
            </AppButton>
          </View>
        </View>

        {/* Sessions Section (Placeholder) */}
        <View style={[styles.section, { marginTop: 32 }]}>
          <View style={styles.headerRow}>
            <Icon name="Smartphone" size={20} color={colors.primary} />
            <AppText
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              {t("SECURITY.LABEL_ACTIVE_SESSIONS")}
            </AppText>
          </View>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sessionItem}>
              <Icon name="Smartphone" size={24} color={colors.neutrals400} />
              <View style={{ flex: 1 }}>
                <AppText
                  style={{ color: colors.foreground, fontWeight: "600" }}
                >
                  Samsung A52
                </AppText>
                <AppText style={{ color: colors.neutrals400, fontSize: 12 }}>
                  Hồ Chí Minh • Vừa truy cập
                </AppText>
              </View>
              <AppText
                style={{ color: "#22c55e", fontSize: 12, fontWeight: "bold" }}
              >
                THIẾT BỊ NÀY
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  section: {},
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  form: { gap: 16 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  sessionItem: { flexDirection: "row", alignItems: "center", gap: 12 },
});

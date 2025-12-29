import React from "react";
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/store/hooks";
import { setToken } from "@/store/slices/appSlice";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import * as Application from "expo-application";
import { MenuLink } from "@/components/settings/MenuLink";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const colors = useColors();

  const handleLogout = () => {
    Alert.alert(
      t("SETTINGS.LOGOUT"), 
      t("SETTINGS.LOGOUT_CONFIRM"), 
      [
        { text: t("COMMON.CANCEL"), style: "cancel" },
        {
          text: t("SETTINGS.LOGOUT"),
          style: "destructive",
          onPress: () => dispatch(setToken(null)),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingVertical: 20 }}
    >
      {/* Group 1: Tài khoản */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>
          {t("SETTINGS.SECTION_ACCOUNT")}
        </AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MenuLink
            icon="User"
            label={t("SETTINGS.EDIT_PROFILE")}
            subLabel={t("SETTINGS.PROFILE_DESC")}
            href="/settings/account"
          />
          <MenuLink
            icon="Shield"
            label={t("SETTINGS.SECURITY")}
            subLabel={t("SETTINGS.SECURITY_DESC")}
            href="/settings/security"
          />
        </View>
      </View>

      {/* Group 2: Ứng dụng */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>
          {t("SETTINGS.SECTION_APP")}
        </AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MenuLink
            icon="Settings2"
            label={t("SETTINGS.PREFERENCES")}
            subLabel={t("SETTINGS.PREFERENCES_DESC")}
            href="/settings/preferences"
          />
          <MenuLink
            icon="Bell"
            label={t("SETTINGS.NOTIFICATIONS")}
            href="/settings/notifications"
          />
        </View>
      </View>

      {/* Group 3: Thông tin */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>
          {t("SETTINGS.SECTION_INFO")}
        </AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <MenuLink
            icon="Info"
            label={t("SETTINGS.ABOUT")}
            href="/settings/about"
          />
        </View>
      </View>

      {/* Group 4: Logout */}
      <View style={styles.section}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              overflow: "hidden",
            },
          ]}
        >
          <MenuLink
            icon="LogOut"
            label={t("SETTINGS.LOGOUT")}
            isDestructive
            onPress={handleLogout}
          />
        </View>
        <AppText style={styles.versionText}>
          {" "}
          {t("COMMON.VERSION")} {Application.nativeApplicationVersion} (Build{" "}
          {Application.nativeBuildVersion}){" "}
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  versionText: {
    textAlign: "center",
    marginTop: 12,
    color: "#cbd5e1",
    fontSize: 12,
  },
});

import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
// 👇 Import type rõ ràng để tránh lỗi "Value used as Type"
import type { TouchableOpacityProps } from "react-native";
import { useRouter, Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setToken } from "@/store/slices/appSlice";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { cn } from "@/utils";
import * as Application from "expo-application";

// --- 1. MENU LINK COMPONENT (Tách ra ngoài) ---
interface MenuLinkProps extends TouchableOpacityProps {
  icon: string;
  label: string;
  subLabel?: string;
  href?: Href<string>;
  isDestructive?: boolean;
  // Props bổ sung để render UI đúng theme (truyền từ cha vào hoặc gọi hook bên trong)
}

const MenuLink = (prop: MenuLinkProps) => {
  const {
    icon,
    label,
    subLabel,
    href,
    isDestructive,
    onPress,
    style,
    ...props
  } = prop;
  const router = useRouter();
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();

  const handlePress = (e: any) => {
    if (onPress) {
      // Nếu có onPress tùy chỉnh (ví dụ Logout) thì chạy nó
      onPress(e);
    } else if (href) {
      // Nếu không thì chuyển trang
      router.push(href);
    }
  };

  const iconBgColor = isDestructive
    ? "#fee2e2"
    : theme === "dark"
      ? "#333"
      : "#f3f4f6";

  const contentColor = isDestructive ? "#ef4444" : colors.foreground;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.menuItem,
        {
          borderBottomColor: theme === "dark" ? "#333" : "#f1f5f9",
          backgroundColor: isDestructive
            ? theme === "dark"
              ? "#331111"
              : "#fef2f2"
            : "transparent",
        },
        style,
      ]}
      {...props}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Icon
            name={icon as any}
            className={cn(
              "w-5 h-5",
              isDestructive ? "text-red-500" : "text-foreground"
            )}
            size={20}
            color={contentColor}
          />
        </View>
        <View>
          <AppText style={[styles.menuLabel, { color: contentColor }]}>
            {label}
          </AppText>
          {subLabel ? (
            <AppText style={styles.subLabel}> {subLabel} </AppText>
          ) : null}
        </View>
      </View>

      {!isDestructive && (
        <Icon
          name="ChevronRight"
          size={20}
          color={colors.neutrals400}
          className="w-5 h-5 text-gray-400"
        />
      )}
    </TouchableOpacity>
  );
};

// --- 2. MAIN SCREEN ---
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
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 16, fontWeight: "500" },
  subLabel: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  versionText: {
    textAlign: "center",
    marginTop: 12,
    color: "#cbd5e1",
    fontSize: 12,
  },
});

import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { AppText, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import * as Application from "expo-application";

export default function AboutScreen() {
  const { t } = useTranslation();
  const colors = useColors();

  const handleOpenLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const RenderLinkItem = ({ label, icon, url, isLast }: any) => (
    <TouchableOpacity
      onPress={() => handleOpenLink(url)}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Icon name={icon} size={20} color={colors.foreground} />
        <AppText style={{ fontSize: 16, color: colors.foreground }}>
          {label}
        </AppText>
      </View>
      <Icon name="ExternalLink" size={16} color={colors.neutrals400} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 1. HEADER LOGO & VERSION */}
      <View style={styles.headerContainer}>
        <View style={styles.logoBox}>
          <Image
            source={require("../../assets/icon.png")} // Đảm bảo đường dẫn icon đúng
            style={{ width: 80, height: 80, borderRadius: 20 }}
          />
        </View>
        <AppText style={[styles.appName, { color: colors.foreground }]}>
          Cứu Trợ VN
        </AppText>
        <AppText style={styles.versionText}>
          Version {Application.nativeApplicationVersion} (
          {Application.nativeBuildVersion})
        </AppText>
      </View>

      {/* 2. THÔNG TIN PHÁP LÝ */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>PHÁP LÝ & QUYỀN RIÊNG TƯ</AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <RenderLinkItem
            label="Điều khoản sử dụng"
            icon="FileText"
            url="https://your-domain.com/terms"
          />
          <RenderLinkItem
            label="Chính sách bảo mật"
            icon="ShieldCheck"
            url="https://your-domain.com/privacy"
            isLast={true}
          />
        </View>
      </View>

      {/* 3. LIÊN HỆ */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>LIÊN HỆ ĐỘI NGŨ</AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <RenderLinkItem
            label="Website trang chủ"
            icon="Globe"
            url="https://your-domain.com"
          />
          <RenderLinkItem
            label="Gửi phản hồi (Email)"
            icon="Mail"
            url="mailto:support@your-domain.com"
          />
          <RenderLinkItem
            label="Đánh giá ứng dụng"
            icon="Star"
            url="market://details?id=com.cuutro.app" // Link CH Play/AppStore
            isLast={true}
          />
        </View>
      </View>

      {/* 4. COPYRIGHT */}
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 40 }}>
        <AppText style={{ color: colors.neutrals500, fontSize: 12 }}>
          © 2025 CuuTro Team. All rights reserved.
        </AppText>
        <AppText
          style={{ color: colors.neutrals500, fontSize: 12, marginTop: 4 }}
        >
          Made with ❤️ in Vietnam
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 10,
  },
  logoBox: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  versionText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  section: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
});

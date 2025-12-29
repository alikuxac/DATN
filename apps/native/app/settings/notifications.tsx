import React, { useState, useRef } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { SwitchItem } from "@/components/settings/SwitchItem";

// Định nghĩa các loại thông báo
interface NotificationSettings {
  pushEnabled: boolean;
  sosAlerts: boolean;
  activityUpdates: boolean;
  newsLetters: boolean;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { showToast } = useToast();

  // State giả lập (Sau này bạn có thể fetch từ API user profile)
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    sosAlerts: true,
    activityUpdates: false,
    newsLetters: true,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm xử lý toggle có debounce gọi API
  const handleToggle = (key: keyof NotificationSettings) => {
    // 1. Optimistic Update (Cập nhật UI ngay)
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    // 2. Debounce Call API
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        console.log(
          `[API] Updating notification setting: ${key} = ${newValue}`
        );
        // await apiService.put("/user/settings/notifications", { [key]: newValue });
      } catch (error) {
        showToast(t("COMMON.ERROR"), "Không thể lưu cài đặt", "error");
        // Revert nếu lỗi (Optional)
        setSettings((prev) => ({ ...prev, [key]: !newValue }));
      }
    }, 1000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* SECTION 1: TỔNG QUAN */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>THÔNG BÁO ĐẨY</AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SwitchItem
            label="Cho phép thông báo"
            description="Nhận thông báo trên thiết bị này"
            icon="Bell"
            value={settings.pushEnabled}
            onToggle={() => handleToggle("pushEnabled")}
            isLast={true}
          />
        </View>
      </View>

      {/* SECTION 2: LOẠI THÔNG BÁO */}
      <View style={styles.section}>
        <AppText style={styles.sectionHeader}>TÙY CHỈNH LOẠI TIN</AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SwitchItem
            label="Cảnh báo Khẩn cấp (SOS)"
            description="Rung chuông khi có người kêu cứu gần bạn"
            icon="Siren" // Hoặc AlertTriangle
            value={settings.sosAlerts}
            onToggle={() => handleToggle("sosAlerts")}
          />

          <SwitchItem
            label="Cập nhật Hoạt động"
            description="Khi báo cáo của bạn được duyệt hoặc xử lý"
            icon="Activity"
            value={settings.activityUpdates}
            onToggle={() => handleToggle("activityUpdates")}
          />

          <SwitchItem
            label="Tin tức & Hệ thống"
            description="Các bản cập nhật ứng dụng và tin tức cứu trợ"
            icon="Newspaper"
            value={settings.newsLetters}
            onToggle={() => handleToggle("newsLetters")}
            isLast={true}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
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
});

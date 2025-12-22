import React from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { AppText, AppButton, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";

// Danh sách quyền bắt buộc để App hoạt động tốt nhất
const REQUIRED_PERMISSIONS = [
  {
    id: "location",
    icon: "MapPin",
    title: "Vị trí của bạn",
    desc: "Để hiển thị bản đồ cứu trợ và gửi tọa độ SOS khi cần thiết.",
    isCritical: true, // Bắt buộc phải có
  },
  {
    id: "notification",
    icon: "Bell",
    title: "Thông báo",
    desc: "Nhận cảnh báo thiên tai và tin tức từ người thân kịp thời.",
    isCritical: false, // Khuyến khích
  },
  {
    id: "camera",
    icon: "Camera",
    title: "Camera & Ảnh",
    desc: "Để gửi hình ảnh báo cáo hiện trường hoặc cập nhật trạng thái.",
    isCritical: false,
  },
];

interface PermissionGuardProps {
  children: React.ReactNode;
}

export const PermissionGuard = ({ children }: PermissionGuardProps) => {
  const {
    permissions,
    requestLocation,
    openSettings,
  } = useAppPermissions();
  const colors = useColors();

  // Nếu đang loading thì hiện màn hình trắng hoặc loading
  if (permissions.loading) return null;

  // Logic: Nếu thiếu quyền LOCATION (quan trọng nhất) -> Chặn lại bắt xin
  // Các quyền khác có thể xin sau (lazy request)
  const isLocationMissing = !permissions.location;

  if (!isLocationMissing) {
    return <>{children}</>;
  }

  // --- GIAO DIỆN XIN QUYỀN ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="Shield" size={40} color={colors.primary} />
          </View>
          <AppText style={styles.title}>Cấp quyền truy cập</AppText>
          <AppText style={styles.subtitle}>
            Để bảo vệ bạn và cộng đồng tốt hơn, ứng dụng cần một số quyền sau:
          </AppText>
        </View>

        <View style={styles.list}>
          {REQUIRED_PERMISSIONS.map((item) => {
            // Check trạng thái của từng quyền
            let isGranted = false;
            if (item.id === "location") isGranted = permissions.location;

            return (
              <View key={item.id} style={styles.item}>
                <View
                  style={[
                    styles.itemIcon,
                    { backgroundColor: isGranted ? "#dcfce7" : "#f1f5f9" },
                  ]}
                >
                  <Icon
                    name={isGranted ? "Check" : (item.icon as any)}
                    size={24}
                    color={isGranted ? "#16a34a" : "#64748b"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.itemTitle}>{item.title}</AppText>
                  <AppText style={styles.itemDesc}>{item.desc}</AppText>
                </View>
                {/* Nút Action */}
                {!isGranted && (
                  <AppButton
                    variant="ghost"
                    size="sm"
                    children={<AppText>Cấp quyền</AppText>}
                    onPress={() => {
                      if (item.id === "location") requestLocation();
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* Nút tiếp tục hoặc mở setting */}
        <View style={styles.footer}>
          {!permissions.location ? (
            <View>
              <AppText style={styles.warningText}>
                * Quyền Vị trí là bắt buộc để sử dụng ứng dụng.
              </AppText>
              <AppButton
                children={<AppText>Mở Cài đặt hệ thống</AppText>}
                variant="outline"
                onPress={openSettings}
                className="mt-2"
              />
            </View>
          ) : // Trường hợp Location OK nhưng Notification chưa (nếu bạn muốn ép buộc cả Noti)
          // Ở đây mình cho phép đi tiếp nếu Location OK
          null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  content: { padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { textAlign: "center", color: "#64748b", lineHeight: 22 },
  list: { gap: 20 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  itemDesc: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  footer: { marginTop: 40 },
  warningText: {
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
    fontStyle: "italic",
  },
});

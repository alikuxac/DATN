import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AppText, AppButton, Icon } from "@/components/ui";
import { useColors } from "@/hooks/useColors";

interface AlertData {
  title: string;
  content: string;
  level: "INFO" | "WARNING" | "CRITICAL";
  instruction?: string; // Hướng dẫn (VD: "Tìm nơi cao hơn...")
  _id?: string;
}

interface Props {
  visible: boolean;
  data: AlertData | null;
  onClose: () => void;
}

export const SystemAlertModal = ({ visible, data, onClose }: Props) => {
  const colors = useColors();

  if (!data) return null;

  const isCritical = data.level === "CRITICAL";
  const isWarning = data.level === "WARNING";

  // Màu sắc chủ đạo dựa trên mức độ
  const headerBg = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#3b82f6";
  const iconName = isCritical
    ? "TriangleAlert"
    : isWarning
      ? "AlertCircle"
      : "Info";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, isCritical && styles.criticalBorder]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <Icon name={iconName as any} size={48} color="white" />
            <AppText className="text-white font-bold text-xl mt-3 text-center uppercase">
              {isCritical ? "CẢNH BÁO KHẨN CẤP" : data.title}
            </AppText>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.content}>
            {isCritical && (
              <AppText className="text-red-600 font-bold text-lg text-center mb-2">
                {data.title}
              </AppText>
            )}

            <AppText className="text-base text-gray-800 text-center leading-6 mb-4">
              {data.content}
            </AppText>

            {data.instruction && (
              <View className="bg-gray-100 p-4 rounded-xl w-full border border-gray-200">
                <View className="flex-row items-center mb-2">
                  <Icon name="Shield" size={16} color="#4b5563" />
                  <AppText className="font-bold ml-2 text-gray-700">
                    HƯỚNG DẪN AN TOÀN:
                  </AppText>
                </View>
                <AppText className="text-gray-600 italic">
                  "{data.instruction}"
                </AppText>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <AppButton
              children="TÔI ĐÃ HIỂU"
              onPress={onClose}
              style={{ backgroundColor: headerBg, width: "100%" }}
              textClassname="font-bold text-white"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "80%",
  },
  criticalBorder: {
    borderWidth: 3,
    borderColor: "#ef4444",
  },
  header: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
});

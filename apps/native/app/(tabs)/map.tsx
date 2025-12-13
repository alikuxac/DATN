import React, { useState, useEffect } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  Platform, // 👈 Quan trọng để check nền tảng
  Alert,
  Text, // Thêm Text để hiện thông báo trên Web
} from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

// Components
import { cn } from "@/utils";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { AppText, AppInput, AppButton, Icon, Badge } from "@/components/ui";
import VietMaap, { MapView } from '@vietmap/vietmap-gl-react-native';
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// --- CONFIG ---
const VIETMAP_API_KEY = "";
const MAP_STYLE_URL = `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${VIETMAP_API_KEY}`;

// 👇 1. LOAD THƯ VIỆN CÓ ĐIỀU KIỆN
// Chỉ load Vietmap nếu KHÔNG PHẢI là Web
let Vietmap: any = null;
if (Platform.OS !== "web") {
  try {
    Vietmap = require("@vietmap/vietmap-gl-react-native");
  } catch (err) {
    console.error("Failed to load Vietmap:", err);
  }
}

// Props
interface MapInterfaceProps {
  language?: "en" | "vn";
  onLanguageToggle?: () => void;
  isDarkMode?: boolean;
  onDarkModeToggle?: () => void;
}

export default function MapScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.app);
  const { showSuccess } = useToast();
  const colors = useColors();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<
    "food" | "water" | "medical" | "evacuation"
  >("food");
  const [reportNotes, setReportNotes] = useState("");

  // Camera State
  const [cameraCenter, setCameraCenter] = useState([106.7009, 10.7769]);

  const mockAlerts = [
    {
      id: 1,
      title: "Evacuation Center - D1",
      type: "evacuation",
      author: "John Doe",
      coordinate: [106.7009, 10.7769],
      severity: "high",
      status: "active",
      created: "14:32",
      address: "123 Nguyen Hue, Q1",
      phone: "028 3822 1234",
    },
    // ... (Giữ nguyên các mock data khác)
  ];

  const handleSubmitReport = () => {
    setShowReportModal(false);
    showSuccess(t("REPORT.SUBMIT_SUCCESS") || "Report submitted successfully");
    setReportNotes("");
  };

  const handleMyLocation = () => {
    const newLat = 10.7 + Math.random() * 0.1;
    const newLng = 106.6 + Math.random() * 0.1;
    setCameraCenter([newLng, newLat]);
  };

  // --- RENDER ---
  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* 👇 2. ĐIỀU KIỆN RENDER */}
      {Platform.OS !== "web" && Vietmap ? (
        // --- MOBILE: Render Map Thật ---
        <Vietmap.MapView
          style={styles.map}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <Vietmap.Camera
            zoomLevel={13}
            centerCoordinate={cameraCenter}
            animationMode="flyTo"
            animationDuration={1000}
          />

          {mockAlerts.map((alert) => (
            <Vietmap.PointAnnotation
              key={alert.id.toString()}
              id={alert.id.toString()}
              coordinate={alert.coordinate}
              onSelected={() => setSelectedReport(alert)}
            >
              <View
                className={cn(
                  "w-10 h-10 rounded-full border-2 border-white items-center justify-center shadow-sm",
                  alert.type === "evacuation" ? "bg-error" : "bg-primary" // Đơn giản hóa logic màu cho gọn
                )}
              >
                <AppText variant="caption" weight="bold" className="text-white">
                  {alert.id}
                </AppText>
              </View>
              <Vietmap.Callout title={alert.title} />
            </Vietmap.PointAnnotation>
          ))}
        </Vietmap.MapView>
      ) : (
        // --- WEB: Render Placeholder (Ảnh giả hoặc Thông báo) ---
        <View
          style={[
            styles.map,
            {
              backgroundColor: "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Icon name="Map" className="w-10 h-10 text-[#9ca3af]" />
          <AppText style={{ marginTop: 16, color: "#6b7280", fontSize: 16 }}>
            Bản đồ Vietmap chỉ hỗ trợ trên Mobile App
          </AppText>
          <AppText style={{ marginTop: 8, color: "#9ca3af", fontSize: 14 }}>
            (Chế độ Web Demo)
          </AppText>
        </View>
      )}

      {/* --- CÁC THÀNH PHẦN OVERLAY (Search, Buttons...) --- */}
      {/* Giữ nguyên toàn bộ phần Search Bar, Legend, Floating Buttons... của bạn ở đây */}
      {/* Vì chúng là View/Text thuần nên chạy tốt trên cả Web và Mobile */}

      <SafeAreaView className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <View className="px-4 pt-2 pointer-events-auto">
          {/* ... Code Search Bar cũ ... */}
          <View className="bg-white/90 p-3 rounded-full shadow-sm">
            <AppText>Demo Search Bar</AppText>
          </View>
        </View>
      </SafeAreaView>

      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

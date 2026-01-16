import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Redirect, useFocusEffect } from "expo-router";

// Components
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { CreateReportModal } from "@/components/map/CreateReportModal";
import { MapReportMarker } from "@/components/map/MapReportMarker";
import { MapRescuerMarker } from "@/components/map/MapRescuerMarker";
import { ReportDetailSheet } from "@/components/map/ReportDetailSheet";
import { RescuerDetailSheet } from "@/components/map/RescuerDetailSheet";

// Vietmap Imports
import {
  Camera,
  MapView,
  PointAnnotation,
} from "@vietmap/vietmap-gl-react-native";

// Redux & API
import { useAppSelector } from "@/store/hooks";
import { apiService } from "@/services/api.service";
import { Plus, LocateFixed } from "lucide-react-native";
import {
  ENUM_REPORT_STATUS,
  ENUM_USER_ROLE,
  ENUM_REPORT_TYPE,
} from "@repo/shared";
import { useLocationTracking } from "@/hooks/useUserLocation";

// --- CONFIG ---
const VIETMAP_API_KEY = process.env.EXPO_PUBLIC_VIETMAP_API_KEY;

// Interfaces (Should handle import normally, but defining here for now if not shared)
interface ReportData {
  _id: string;
  title: string;
  type: ENUM_REPORT_TYPE;
  status: ENUM_REPORT_STATUS;
  location: { lat: number; lng: number };
  coordinates?: [number, number];
  description?: string;
  peopleCount: number;
  severity: string;
  user?: { 
    _id: string; 
    firstName: string; 
    lastName: string; 
    phone?: string;
    lastLocationAt?: string; // Thêm trường này
  };
  volunteer?: string; // ID của rescuer
  createdAt: string;
}

interface RescuerData {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location: { lat: number; lng: number }; // Vị trí hiện tại của Rescuer
  coordinates?: [number, number];
  isOnline: boolean;
  lastLocationAt?: string; // Thêm trường này để tính online
}

export default function MapScreen() {
  const { t } = useTranslation();
  const { theme, user, token } = useAppSelector((state) => state.app);
  const { userLocation, currentRegion, socket } = useLocationTracking(token);
  const { showSuccess, showError } = useToast();
  const colors = useColors();
  const cameraRef = useRef<React.ComponentRef<typeof Camera>>(null);

  if (Platform.OS === "web") return <Redirect href="/(tabs)/account" />;

  // --- STATE ---
  const [reports, setReports] = useState<ReportData[]>([]);
  const [rescuers, setRescuers] = useState<RescuerData[]>([]); // Danh sách Rescuer

  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [selectedRescuer, setSelectedRescuer] = useState<RescuerData | null>(
    null
  );

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // --- MAP STYLE ---
  const getMapStyleUrl = () =>
    `https://maps.vietmap.vn/api/maps/${theme === "dark" ? "dark" : "light"}/styles.json?apikey=${VIETMAP_API_KEY}`;

  // --- API FETCHING ---
  const fetchData = async () => {
    try {

      const param = {
        regionId: currentRegion!,
      }

      const queryString = new URLSearchParams(param as any).toString();
      // 1. Fetch Reports
      const reportRes = await apiService.get<{ data: ReportData[] }>(
        `/admin/report/list?${queryString}`
      );
      setReports(reportRes.data);

      // 2. Fetch Rescuers (Giả lập endpoint lấy vị trí Rescuer)
      // Nếu user là User thường -> Chỉ cần lấy rescuer của mình (có thể BE filter sẵn hoặc Client filter)
      // Nếu user là Admin -> Lấy hết
      if (
        user?.role === ENUM_USER_ROLE.ADMIN ||
        user?.role === ENUM_USER_ROLE.USER
      ) {
        // Endpoint này cần trả về list volunteer đang online kèm tọa độ
        // const rescuerRes = await apiService.get<{ data: RescuerData[] }>("/user/volunteers/active");
        // setRescuers(rescuerRes.data);

        // MOCK DATA (Xóa khi có API thật)
        setRescuers([
          {
            _id: "vol1",
            firstName: "Rescuer",
            lastName: "A",
            location: { lat: 10.85, lng: 106.65 },
            isOnline: true,
            lastLocationAt: new Date().toISOString(), // Vừa mới cập nhật
            phone: "0909090909",
          },
          {
            _id: "vol2",
            firstName: "Rescuer",
            lastName: "B",
            location: { lat: 10.8, lng: 106.7 },
            isOnline: true,
            lastLocationAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 phút trước
          },
        ]);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // --- SOCKET TRACKING ---
  useEffect(() => {
    if (!socket) return;
    
    // Listen for rescuer movement
    const handleRescuerMoved = (data: { rescuerId: string; lat: number; lng: number }) => {
      setRescuers((prev) => 
        prev.map((r) => 
          r._id === data.rescuerId 
            ? { 
                ...r, 
                location: { lat: data.lat, lng: data.lng }, 
                coordinates: [data.lng, data.lat],
                lastLocationAt: new Date().toISOString() // Cập nhật thời gian online
              } 
            : r
        )
      );
    };

    socket.on('rescuer_moved', handleRescuerMoved);
    
    // Auto join room if I have active report (User Mode)
    // Only join if I am a USER (Victim)
    if (user && user.role === ENUM_USER_ROLE.USER) {
       const myActiveReport = reports.find(r => r.user?._id === user._id && r.status === ENUM_REPORT_STATUS.IN_PROGRESS);
       if (myActiveReport) {
           console.log('Joining report room:', myActiveReport._id);
           socket.emit('join_report_room', { reportId: myActiveReport._id });
       }
    }

    return () => {
      socket.off('rescuer_moved', handleRescuerMoved);
    };
  }, [socket, reports, user]);

  const isVolunteerMode = useMemo(() => {
    return user?.role === ENUM_USER_ROLE.VOLUNTEER || user?.isRescueMode;
  }, [user]);

  // --- LOGIC FILTER REPORTS ---
  const displayedReports = useMemo(() => {
    if (!user) return [];
    const currentUserId = user._id;

    if (user.role === ENUM_USER_ROLE.ADMIN) return reports; // Admin thấy hết report

    if (isVolunteerMode) {
      // Volunteer thấy PENDING (để nhận) & IN_PROGRESS của mình
      return reports.filter(
        (r) =>
          r.status === ENUM_REPORT_STATUS.PENDING ||
          (r.status === ENUM_REPORT_STATUS.IN_PROGRESS &&
            r.volunteer === currentUserId)
      );
    }
    // User thường chỉ thấy của mình
    return reports.filter((r) => r.user?._id === currentUserId);
  }, [reports, user]);

  // --- LOGIC FILTER RESCUERS (Logic mới bạn yêu cầu) ---
  const displayedRescuers = useMemo(() => {
    if (!user) return [];

    // 1. Admin: Thấy toàn bộ Rescuer
    if (user.role === ENUM_USER_ROLE.ADMIN) return rescuers;

    // 2. User Thường: Chỉ thấy Rescuer nào đang nhận report của mình
    if (user.role === ENUM_USER_ROLE.USER) {
      // Lấy danh sách ID volunteer đang xử lý report của user này
      const myActiveVolunteers = reports
        .filter(
          (r) =>
            r.user?._id === user._id &&
            r.status === ENUM_REPORT_STATUS.IN_PROGRESS
        )
        .map((r) => r.volunteer);

      return rescuers.filter((res) => myActiveVolunteers.includes(res._id));
    }

    return [];
  }, [rescuers, reports, user]);

  // --- ACTIONS (Xử lý trực tiếp, ko navigate) ---
  const handleReportAction = async (action: "accept" | "reject" | "cancel" | "complete") => {
    if (!selectedReport) return;
    setIsActionLoading(true);
    try {
      if (action === "accept") {
        await apiService.post(`/report/${selectedReport._id}/accept`, {});
        showSuccess("Đã tiếp nhận!");
      } else if (action === "reject") {
        await apiService.post(`/report/${selectedReport._id}/reject`, {});
        showSuccess("Đã hủy tiếp nhận!");
      } else if (action === "complete") {
        await apiService.post(`/report/${selectedReport._id}/complete`, {});
        showSuccess("Nhiệm vụ hoàn thành! Cảm ơn bạn.");
      }
      // Refresh data & Close modal
      await fetchData();
      setSelectedReport(null);
    } catch (err) {
      showError("Lỗi", "Không thể thực hiện hành động.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else showError("Lỗi", "Không có số điện thoại");
  };

  const handleRecenter = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: 15, // Zoom gần lại chút cho dễ nhìn
        animationDuration: 2000, // Hiệu ứng bay trong 1 giây
        animationMode: "flyTo",
      });
    } else {
      // Nếu chưa có vị trí (do chưa load xong hoặc chưa cấp quyền), thử gọi lại hàm lấy vị trí
      // getUserLocation(); // Gọi hàm này nếu bạn đã define nó như ở bước trước
      showError("Chưa có vị trí", "Đang định vị...");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      <MapView
        style={styles.map}
        mapStyle={getMapStyleUrl()}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={() => {
          setSelectedReport(null);
          setSelectedRescuer(null);
        }}
      >
        <Camera
          ref={cameraRef}
          zoomLevel={13}
          centerCoordinate={
             userLocation ? [userLocation.longitude, userLocation.latitude] : [106.660172, 10.762622]
          }
          animationMode="flyTo"
        />

        {/* 1. MY LOCATION */}
        {userLocation && (
          <PointAnnotation
            id="user-location"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarkerDot} />
              <View style={styles.userMarkerHalo} />
            </View>
          </PointAnnotation>
        )}

        {/* 2. REPORT MARKERS */}
        {displayedReports.map((report) => (
          <MapReportMarker
            key={report._id}
            report={report}
            onSelected={(r) => {
              setSelectedRescuer(null);
              setSelectedReport(r);
            }}
          />
        ))}

        {/* 3. RESCUER MARKERS (Blue Medical Cross / Human Icon) */}
        {displayedRescuers.map((rescuer) => (
          <MapRescuerMarker
            key={rescuer._id}
            rescuer={rescuer}
            onSelected={(r) => {
              setSelectedReport(null);
              setSelectedRescuer(r);
            }}
          />
        ))}
      </MapView>

      {!userLocation && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {/* --- CREATE BUTTON (User/Volunteer) --- */}
      {user?.role !== ENUM_USER_ROLE.ADMIN && (
        <View className="absolute bottom-24 right-5 z-20">
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="w-14 h-14 rounded-full items-center justify-center shadow-xl elevation-5"
            style={{ backgroundColor: colors.primary }}
          >
            <Plus color="white" size={32} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRecenter}
            className="w-14 h-14 rounded-full items-center justify-center shadow-xl elevation-5 bg-white dark:bg-neutrals800 mt-4"
          >
            {/* Icon màu xanh dương giống Google Maps */}
            <LocateFixed color={colors.primary} size={28} />
          </TouchableOpacity>
        </View>
      )}

      <CreateReportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        location={
          userLocation
            ? { lat: userLocation.latitude, long: userLocation.longitude }
            : null
        }
        onSuccess={() => fetchData()}
      />

      {/* --- BOTTOM SHEET: REPORT DETAIL (NO NAVIGATION) --- */}
      {selectedReport && (
        <ReportDetailSheet
          selectedReport={selectedReport}
          onClose={() => setSelectedReport(null)}
          isVolunteerMode={!!isVolunteerMode}
          user={user}
          isActionLoading={isActionLoading}
          handleReportAction={handleReportAction}
          handleCall={handleCall}
        />
      )}

      {/* --- BOTTOM SHEET: RESCUER INFO (Chỉ hiện khi click vào Rescuer marker) --- */}
      {selectedRescuer && (
        <RescuerDetailSheet
          selectedRescuer={selectedRescuer}
          onClose={() => setSelectedRescuer(null)}
          handleCall={handleCall}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  userMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    borderColor: "white",
    borderWidth: 3,
    zIndex: 2,
  },
  userMarkerHalo: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    zIndex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -25,
    marginTop: -25,
  }
});

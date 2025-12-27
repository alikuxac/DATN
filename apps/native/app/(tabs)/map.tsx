import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Redirect, useFocusEffect } from "expo-router";
import * as Location from "expo-location";

// Components
import { cn } from "@/utils";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { AppText, AppButton, Icon, Avatar } from "@/components/ui";
import { CreateReportModal } from "@/components/map/CreateReportModal";

// Vietmap Imports
import {
  Camera,
  MapView,
  PointAnnotation,
} from "@vietmap/vietmap-gl-react-native";

// Redux & API
import { useAppSelector } from "@/store/hooks";
import { apiService } from "@/services/api.service";
import { Plus, Phone, Navigation, LocateFixed } from "lucide-react-native"; // Thêm icon
import {
  ENUM_REPORT_STATUS,
  ENUM_USER_ROLE,
  ENUM_REPORT_TYPE,
} from "@repo/shared";
import { useLocationTracking } from "@/hooks/useUserLocation";

// --- CONFIG ---
const VIETMAP_API_KEY = process.env.EXPO_PUBLIC_VIETMAP_API_KEY;
const DEFAULT_COORDINATE: [number, number] = [106.660172, 10.762622];

// Interfaces
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
  user?: { _id: string; firstName: string; lastName: string; phone?: string };
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
}

export default function MapScreen() {
  const { t } = useTranslation();
  const { theme, user, token } = useAppSelector((state) => state.app);
  const { userLocation, currentRegion } = useLocationTracking(token);
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

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
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

      const queryString = new URLSearchParams(param).toString();
      // 1. Fetch Reports
      const reportRes = await apiService.get<{ data: ReportData[] }>(
        `/admin/report/list${queryString}`
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
            phone: "0909090909",
          },
          {
            _id: "vol2",
            firstName: "Rescuer",
            lastName: "B",
            location: { lat: 10.8, lng: 106.7 },
            isOnline: true,
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
  const handleReportAction = async (action: "accept" | "reject" | "cancel") => {
    if (!selectedReport) return;
    setIsActionLoading(true);
    try {
      if (action === "accept") {
        await apiService.post(`/report/${selectedReport._id}/accept`, {});
        showSuccess("Đã tiếp nhận!");
      } else if (action === "reject") {
        await apiService.post(`/report/${selectedReport._id}/reject`, {});
        showSuccess("Đã hủy tiếp nhận!");
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

  // --- HELPER UI ---
  const getPinColorClass = (status: ENUM_REPORT_STATUS) => {
    switch (status) {
      case ENUM_REPORT_STATUS.PENDING:
        return "bg-red-500 border-red-200";
      case ENUM_REPORT_STATUS.IN_PROGRESS:
        return "bg-yellow-500 border-yellow-200";
      case ENUM_REPORT_STATUS.VERIFIED:
        return "bg-blue-500 border-blue-200";
      case ENUM_REPORT_STATUS.RESOLVED:
        return "bg-green-500 border-green-200";
      default:
        return "bg-gray-500 border-gray-200";
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
          centerCoordinate={[userLocation!.longitude, userLocation!.latitude]}
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
          <PointAnnotation
            key={report._id}
            id={report._id}
            coordinate={
              report.coordinates || [report.location.lng, report.location.lat]
            }
            onSelected={() => {
              setSelectedRescuer(null);
              setSelectedReport(report);
            }}
          >
            <View
              className={cn(
                "w-10 h-10 rounded-full border-2 items-center justify-center shadow-lg",
                getPinColorClass(report.status)
              )}
            >
              <Icon
                name={
                  report.type === ENUM_REPORT_TYPE.MEDICAL
                    ? "Stethoscope"
                    : report.type === ENUM_REPORT_TYPE.FOOD
                      ? "Utensils"
                      : "TriangleAlert"
                }
                size={20}
                color="white"
              />
            </View>
          </PointAnnotation>
        ))}

        {/* 3. RESCUER MARKERS (Blue Medical Cross / Human Icon) */}
        {displayedRescuers.map((rescuer) => (
          <PointAnnotation
            key={rescuer._id}
            id={`rescuer-${rescuer._id}`}
            coordinate={
              rescuer.coordinates || [
                rescuer.location.lng,
                rescuer.location.lat,
              ]
            }
            onSelected={() => {
              setSelectedReport(null);
              setSelectedRescuer(rescuer);
            }}
          >
            <View className="items-center">
              <View className="bg-white p-1 rounded-full border-2 border-blue-500 shadow-sm mb-1">
                <Icon name="Ambulance" size={20} color="#3b82f6" />
              </View>
              <View className="bg-white/90 px-2 py-0.5 rounded shadow-sm">
                <AppText className="text-[10px] font-bold text-blue-700">
                  {rescuer.firstName}
                </AppText>
              </View>
            </View>
          </PointAnnotation>
        ))}
      </MapView>

      {!userLocation && (
        <View>
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
            className="w-14 h-14 rounded-full items-center justify-center shadow-xl elevation-5 bg-white dark:bg-neutrals800"
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
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutrals900 rounded-t-3xl shadow-2xl z-50 max-h-[50%]">
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Header */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-2 mb-1">
                  <View
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px]",
                      getPinColorClass(selectedReport.status).split(" ")[0]
                    )}
                  >
                    <AppText className="text-white font-bold uppercase">
                      {selectedReport.status}
                    </AppText>
                  </View>
                  <AppText className="text-gray-400 text-xs">
                    {new Date(selectedReport.createdAt).toLocaleTimeString()} -{" "}
                    {new Date(selectedReport.createdAt).toLocaleDateString()}
                  </AppText>
                </View>
                <AppText
                  variant="heading4"
                  className="font-bold text-foreground"
                >
                  {selectedReport.title || "Khẩn cấp: " + selectedReport.type}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedReport(null)}
                className="p-1 bg-gray-100 rounded-full"
              >
                <Icon name="X" size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <AppText className="text-gray-600 dark:text-gray-300 mb-4">
              {selectedReport.description || "Không có mô tả chi tiết."}
            </AppText>

            <View className="flex-row gap-4 mb-4">
              <View className="bg-gray-50 dark:bg-neutrals800 p-2 rounded-lg flex-1 items-center">
                <AppText className="text-xs text-gray-400">Số người</AppText>
                <AppText className="font-bold text-lg">
                  {selectedReport.peopleCount}
                </AppText>
              </View>
              <View className="bg-gray-50 dark:bg-neutrals800 p-2 rounded-lg flex-1 items-center">
                <AppText className="text-xs text-gray-400">Mức độ</AppText>
                <AppText className="font-bold text-lg text-red-500">
                  {selectedReport.severity}
                </AppText>
              </View>
            </View>

            {/* Info User (Người tạo) */}
            {selectedReport.user && (
              <View className="flex-row items-center justify-between mb-6 bg-gray-50 dark:bg-neutrals800 p-3 rounded-xl">
                <View className="flex-row items-center">
                  <Avatar size="md" text={selectedReport.user.firstName} />
                  <View className="ml-3">
                    <AppText className="text-xs text-gray-400">
                      Người cần cứu
                    </AppText>
                    <AppText className="font-bold">
                      {selectedReport.user.firstName}{" "}
                      {selectedReport.user.lastName}
                    </AppText>
                  </View>
                </View>
                {/* Chỉ hiện nút gọi nếu là Volunteer/Admin */}
                {(isVolunteerMode || user?.role === ENUM_USER_ROLE.ADMIN) && (
                  <TouchableOpacity
                    onPress={() => handleCall(selectedReport.user?.phone)}
                    className="bg-green-500 p-2 rounded-full"
                  >
                    <Phone size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ACTION BUTTONS (Logic quan trọng) */}
            <View className="flex-row gap-3">
              {/* 1. Nếu là VOLUNTEER và Report đang PENDING -> Nút NHẬN */}
              {isVolunteerMode &&
                selectedReport.status === ENUM_REPORT_STATUS.PENDING && (
                  <AppButton
                    disabled={isActionLoading}
                    onPress={() => handleReportAction("accept")}
                    className="flex-1 bg-blue-600 rounded-xl"
                    textClassname="text-white font-bold"
                  >
                    {isActionLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      "TIẾP NHẬN CỨU TRỢ"
                    )}
                  </AppButton>
                )}

              {/* 2. Nếu là VOLUNTEER và Report đang IN_PROGRESS (của mình) -> Nút HỦY/HOÀN THÀNH */}
              {isVolunteerMode &&
                selectedReport.status === ENUM_REPORT_STATUS.IN_PROGRESS &&
                selectedReport.volunteer === user?._id && (
                  <AppButton
                    disabled={isActionLoading}
                    onPress={() => handleReportAction("reject")}
                    className="flex-1 bg-red-100 rounded-xl"
                    textClassname="text-red-600 font-bold"
                  >
                    HỦY TIẾP NHẬN
                  </AppButton>
                  // Có thể thêm nút "HOÀN THÀNH" ở đây nếu có API
                )}

              {/* 3. Nút Chỉ Đường (Chung cho tất cả) */}
              <AppButton
                variant="outline"
                className="w-14 rounded-xl items-center justify-center border-gray-300"
                onPress={() =>
                  Alert.alert("Coming Soon", "Mở Google Map chỉ đường...")
                }
              >
                <Navigation size={20} color="black" />
              </AppButton>
            </View>
          </ScrollView>
        </View>
      )}

      {/* --- BOTTOM SHEET: RESCUER INFO (Chỉ hiện khi click vào Rescuer marker) --- */}
      {selectedRescuer && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutrals900 p-5 rounded-t-3xl shadow-2xl z-50">
          <View className="items-center">
            <Avatar
              size="xl"
              text={selectedRescuer.firstName}
              className="mb-3 border-4 border-white shadow-sm"
            />
            <AppText variant="heading3" className="font-bold">
              {selectedRescuer.firstName} {selectedRescuer.lastName}
            </AppText>
            <View className="bg-blue-100 px-3 py-1 rounded-full mt-2 mb-4">
              <AppText className="text-blue-700 font-bold text-xs uppercase">
                Đội cứu hộ tình nguyện
              </AppText>
            </View>

            <View className="flex-row gap-4 w-full px-4">
              <AppButton
                className="flex-1 bg-green-500 rounded-xl"
                onPress={() => handleCall(selectedRescuer.phone)}
              >
                <View className="flex-row items-center gap-2">
                  <Phone size={18} color="white" />
                  <AppText className="text-white font-bold">Gọi điện</AppText>
                </View>
              </AppButton>
              <AppButton
                variant="outline"
                className="flex-1 rounded-xl"
                onPress={() => setSelectedRescuer(null)}
              >
                Đóng
              </AppButton>
            </View>
          </View>
        </View>
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
});

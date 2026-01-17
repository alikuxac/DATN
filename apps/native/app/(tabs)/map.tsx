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
  Text,
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
  location: { 
    lat: number; 
    lng: number;
    coordinates?: [number, number]; // GeoJSON: [lng, lat]
  };
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
  location: { lat: number; lng: number, coordinates?: [number, number] }; // Vị trí hiện tại của Rescuer
  coordinates?: [number, number];
  isOnline: boolean;
  lastLocationAt?: string; // Thêm trường này để tính online
}

export default function MapScreen() {
  const { t } = useTranslation();
  const { theme, user, token } = useAppSelector((state) => state.app);
  const { userLocation, currentRegion, socket } = useLocationTracking(token);
  const { showSuccess, showError, showToast } = useToast();
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
  
  // Location Picker State
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; long: number } | null>(null);
  const centerCoordinateRef = useRef<[number, number] | null>(null);

  // --- MAP STYLE ---
  const getMapStyleUrl = () =>
    `https://maps.vietmap.vn/api/maps/${theme === "dark" ? "dark" : "light"}/styles.json?apikey=${VIETMAP_API_KEY}`;
    
  // --- LOCATION PICKER LOGIC ---
  const handlePickLocation = () => {
      setModalVisible(false);
      setIsPickingLocation(true);
      showToast({ title: "Thông báo", message: "Di chuyển bản đồ và bấm 'Chọn vị trí này'", type: "info" });
  };

  const confirmLocation = async () => {
       // Prefer using Ref from onRegionDidChange
       let center = centerCoordinateRef.current;
       
       if (center) {
           setPickedLocation({ lat: center[1], long: center[0] });
           setIsPickingLocation(false);
           setModalVisible(true);
       } else {
           showError("Lỗi", "Chưa lấy được vị trí, vui lòng di chuyển bản đồ chút xíu.");
       }
  };

  // --- API FETCHING ---
  const fetchData = async () => {
    if (!token) return;

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

      setReports(reportRes.data);

      // 2. Fetch Rescuers (Real Data)
      if (user?.role === ENUM_USER_ROLE.USER) {
          const activeReports = reportRes.data.filter(r => 
              r.status === ENUM_REPORT_STATUS.IN_PROGRESS && r.volunteer
          );
          
          if (activeReports.length > 0) {
              const rescuerIds = [...new Set(activeReports.map(r => r.volunteer!))];
              const fetchedRescuers: RescuerData[] = [];

              // Fetch details for each unique rescuer
              for (const rescuerId of rescuerIds) {
                  try {
                      // Using a public or accessible endpoint to get basic rescuer info
                      // Assuming GET /users/:id or similar exists and returns location
                      // If not, we might need a specific endpoint. 
                      // Trying /users/info/${id} or similar if defined, otherwise falling back
                      // to waiting for socket or basic info if available.
                      // Investigating User Controller later if this fails.
                      // For now, let's try to fetch user info.
                      const res = await apiService.get<any>(`/user/info/${rescuerId}`); // Corrected endpoint
                      if (res.data) {
                          fetchedRescuers.push({
                              _id: res.data._id,
                              firstName: res.data.firstName,
                              lastName: res.data.lastName,
                              phone: res.data.mobileNumber, // Using mobileNumber from DTO
                              location: res.data.lastLocation || { lat: 0, lng: 0 }, // fallback
                              isOnline: true, // simplified
                          });
                      }
                  } catch (e) {
                      console.log(`Failed to fetch rescuer ${rescuerId}`, e);
                  }
              }
              setRescuers(fetchedRescuers);
          }
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [token, currentRegion])
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
                location: { ...r.location, lat: data.lat, lng: data.lng }, 
                coordinates: [data.lng, data.lat],
                lastLocationAt: new Date().toISOString()
              } 
            : r
        )
      );
    };

    socket.on('rescuer_moved', handleRescuerMoved);
    
    if (user && user.role === ENUM_USER_ROLE.USER) {
       const myActiveReport = reports.find(r => r.user?._id === user._id && r.status === ENUM_REPORT_STATUS.IN_PROGRESS);
       if (myActiveReport) {
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
    if (!user) return reports; // Fallback show all while loading user
    const currentUserId = user._id;

    if (user.role === ENUM_USER_ROLE.ADMIN) return reports;

    if (isVolunteerMode) {
      return reports.filter((r) => r.status === ENUM_REPORT_STATUS.PENDING || (r.status === ENUM_REPORT_STATUS.IN_PROGRESS && r.volunteer === currentUserId));
    }
    
    return reports.filter((r) => r.user?._id === currentUserId);
  }, [reports, user, isVolunteerMode]);

  const displayedRescuers = useMemo(() => {
    if (!user) return [];

    const result = user.role === ENUM_USER_ROLE.ADMIN ? rescuers : 
                   user.role === ENUM_USER_ROLE.USER ? (() => {
                      const myActiveVolunteers = reports
                        .filter(r => r.user?._id === user._id && r.status === ENUM_REPORT_STATUS.IN_PROGRESS)
                        .map(r => r.volunteer);
                      return rescuers.filter(res => myActiveVolunteers.includes(res._id));
                   })() : [];
    
    return result;
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
        onRegionDidChange={(event) => {
            if (event && event.geometry && event.geometry.coordinates) {
                centerCoordinateRef.current = event.geometry.coordinates as [number, number];
            }
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
        
        {/* PICKING LOCATION PIN (Center) */}
        {isPickingLocation && (
             <View style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -32, marginLeft: -16, zIndex: 100, elevation: 10 }}>
                 <LocateFixed size={32} color="#EF4444" fill="white" /> 
             </View>
        )}

        {/* 1. REPORT MARKERS (Trên cùng để dễ bấm) */}
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

        {/* 2. RESCUER MARKERS */}
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

        {/* 3. MY LOCATION (Dưới cùng để tránh chặn click của Marker) */}
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
      </MapView>

      {!userLocation && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      
      {/* CONFIRM BUTTON FOR PICKING */}
      {isPickingLocation && (
          <View style={{ position: 'absolute', bottom: 50, left: 20, right: 20, alignItems: 'center', zIndex: 50 }}>
               <TouchableOpacity 
                  onPress={confirmLocation}
                  style={{ backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }}
               >
                   <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Chọn vị trí này</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => { setIsPickingLocation(false); setModalVisible(true); }}
                  style={{ marginTop: 10, backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, shadowOpacity: 0.2, elevation: 3 }}
               >
                   <Text style={{ color: '#333' }}>Hủy quay lại</Text>
               </TouchableOpacity>
          </View>
      )}

      {/* --- CREATE BUTTON (User/Volunteer) --- */}
      {!isPickingLocation && user?.role !== ENUM_USER_ROLE.ADMIN && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          >
            <Plus color="white" size={32} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRecenter}
            style={[styles.floatingButton, styles.recenterButton, { backgroundColor: theme === 'dark' ? colors.neutrals800 : 'white' }]}
          >
            {/* Icon màu xanh dương giống Google Maps */}
            <LocateFixed color={colors.primary} size={28} />
          </TouchableOpacity>
        </View>
      )}

      <CreateReportModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); if(pickedLocation) setPickedLocation(null); }}
        location={
           pickedLocation 
           ? pickedLocation
           : (userLocation
            ? { lat: userLocation.latitude, long: userLocation.longitude }
            : null)
        }
        onSuccess={() => { fetchData(); setPickedLocation(null); }}
        onPickLocation={handlePickLocation}
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
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    zIndex: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  recenterButton: {
    marginTop: 16,
  }
});

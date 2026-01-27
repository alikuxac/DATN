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
  LogBox,
} from "react-native";

// Suppress benign VietMap/Mapbox GL warnings regarding style parsing
LogBox.ignoreLogs([
  "line dasharray requires at least two elements",
  "{Thread-", // General thread warnings from native map
  "[ParseStyle]: line dasharray"
]);
import { useTranslation } from "react-i18next";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

// Components
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { CreateReportModal } from "@/components/map/CreateReportModal";
import { MapReportMarker } from "@/components/map/MapReportMarker";
import { MapRescuerMarker } from "@/components/map/MapRescuerMarker";
import { ReportDetailSheet } from "@/components/map/ReportDetailSheet";

import { RescuerDetailSheet } from "@/components/map/RescuerDetailSheet";
import { MapShelterMarker } from "@/components/map/MapShelterMarker";
import { ShelterDetailSheet } from "@/components/map/ShelterDetailSheet";
import { shelterService, Shelter } from "@/services/shelter.service";

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
  IReportListResponse, // Import from shared
} from "@repo/shared";
import { useLocationContext } from "@/context/LocationContext";
import { useIsFocused } from "@react-navigation/native";
import { Icon } from "@/components/ui";
import { calculateDistance } from "@/utils/geo";

  // --- CONFIG ---
  const rawKey = process.env.EXPO_PUBLIC_VIETMAP_API_KEY || "";
  const VIETMAP_API_KEY = rawKey.trim();

  // No local ReportData interface needed anymore
  
  
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
    const { userLocation, currentRegion, socket, setActiveReportId } = useLocationContext();
    const isFocused = useIsFocused();
    const { showSuccess, showError, showToast } = useToast();
    const colors = useColors();
    const cameraRef = useRef<React.ComponentRef<typeof Camera>>(null);
    const router = useRouter();
    
    // Fix Map Validation/Loading: Force remount key
    const [mountKey, setMountKey] = useState(0);

    useFocusEffect(
      useCallback(() => {
         // Force a re-mount of the MapView on the first real focus interaction
         // This helps resolve GL context race conditions causing "blank map" or style parse errors on init
         if (mountKey === 0) {
             setMountKey(k => k + 1);
         }
         fetchData();
      }, [token, currentRegion, user?.role, user?.verification?.email]) // removed mountKey dependency to avoid loop? No, callback dependency...
    );

    useEffect(() => {
      if (Platform.OS === "web") {
        router.replace("/(tabs)/account");
      }
    }, []);
  
    if (Platform.OS === "web") return null; // Render nothing on web while redirecting
  
    // --- STATE ---
    const [reports, setReports] = useState<IReportListResponse[]>([]);
    const [nearbyRescuers, setNearbyRescuers] = useState<RescuerData[]>([]);
    const [shelters, setShelters] = useState<Shelter[]>([]);
    
    // Selection State
    const [selectedReport, setSelectedReport] = useState<IReportListResponse | null>(null);
    const [selectedRescuer, setSelectedRescuer] = useState<RescuerData | null>(null);
    const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
    
    // UI State
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    
    // Location Picker State
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<{ lat: number; long: number } | null>(null);
    const centerCoordinateRef = useRef<[number, number] | null>(null);
    
    // Params handling
    const params = useLocalSearchParams<{ lat: string; long: string; focus: string }>();
  
    useEffect(() => {
        // Only fly to location if focus param changes and is present
        if (params.focus && params.lat && params.long && cameraRef.current) {
            const lat = parseFloat(params.lat);
            const long = parseFloat(params.long);
            
            if (!isNaN(lat) && !isNaN(long)) {
                 // Use a shorter timeout or none if possible.
                 // Also, we can clear the params using router.setParams({ focus: null }) to avoid re-triggering?
                 // But router.setParams works on current route.
                 
                 const timeoutId = setTimeout(() => {
                     cameraRef.current?.setCamera({
                          centerCoordinate: [long, lat],
                          zoomLevel: 16,
                          animationDuration: 1000,
                          animationMode: "flyTo"
                     });
                     // Optional: Clear focus param so it doesn't trigger again on component re-renders if params persist
                     // router.setParams({ focus: "" }); 
                 }, 500);
                 
                 return () => clearTimeout(timeoutId);
            }
        }
    }, [params.focus, params.lat, params.long]);
  
    // Auto-center on user location when first loaded (if not focused/navigated to specific report)
    const hasCenteredRef = useRef(false);
    useEffect(() => {
        if (userLocation && !hasCenteredRef.current && !params.focus) {
            hasCenteredRef.current = true;
            cameraRef.current?.setCamera({
                centerCoordinate: [userLocation.longitude, userLocation.latitude],
                zoomLevel: 15,
                animationMode: "flyTo"
            });
        }
    }, [userLocation, params.focus]);
  
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
      setIsLoading(true);
      try {
        const param = {
          regionId: currentRegion!,
        }
  
        const queryString = new URLSearchParams(param as any).toString();
  
        // 1. Fetch Reports
        const reportRes = await apiService.get<{ data: IReportListResponse[] }>(
          `/user/report?${queryString}`
        );
        setReports(reportRes.data);
  
        // 2. Extract Rescuers from Reports (Optimized: No extra API calls)
        // Only needed for USER role seeing who is coming
        if (user?.role === ENUM_USER_ROLE.USER) {
            const activeReports = reportRes.data.filter(r => 
                r.status === ENUM_REPORT_STATUS.IN_PROGRESS && r.rescuer
            );
            
            if (activeReports.length > 0) {
                 const extractedRescuers: RescuerData[] = [];
                 
                 activeReports.forEach((r) => {
                     const rescuer: any = r.rescuer;
                     // Ensure rescuer is a populated object
                     if (rescuer && typeof rescuer === 'object' && rescuer._id) {
                         const coords = rescuer.location?.coordinates;
                         extractedRescuers.push({
                            _id: rescuer._id.toString(),
                            firstName: rescuer.firstName,
                            lastName: rescuer.lastName,
                            phone: rescuer.mobileNumber, // Taken from populated user
                            location: coords ? { lat: coords[1], lng: coords[0] } : { lat: 0, lng: 0 },
                            coordinates: coords,
                            isOnline: true,
                            lastLocationAt: rescuer.lastLocationAt 
                        });
                     }
                 });

                 // Deduplicate based on ID
                 const uniqueRescuers = Array.from(new Map(extractedRescuers.map(item => [item._id, item])).values());
                 setNearbyRescuers(uniqueRescuers);
            } else {
               setNearbyRescuers([]);
            }
        }
          // 3. Fetch shelters if user has location
          if (userLocation) {
             const sheltersData = await shelterService.getNearbyShelters(
                userLocation.latitude,
                userLocation.longitude,
                10000 // 10km
             );
             setShelters(sheltersData);
          }

       } catch (error) {
          console.error("Error fetching map data:", error);
       } finally {
          setIsLoading(false);
       }
    };
  
    // --- SOCKET TRACKING ---
    
    // 1. Listener for movement (Stable, depends only on socket)
    useEffect(() => {
      if (!socket) return;
      
      const handleRescuerMoved = (data: { rescuerId: string; lat: number; lng: number }) => {
        // console.log("Rescuer moved:", data);
        setNearbyRescuers((prev) => {
          const exists = prev.find(r => r._id === data.rescuerId);
          if (exists) {
              return prev.map((r) => 
                r._id === data.rescuerId 
                  ? { 
                      ...r, 
                      location: { ...r.location, lat: data.lat, lng: data.lng }, 
                      coordinates: [data.lng, data.lat],
                      lastLocationAt: new Date().toISOString()
                    } 
                  : r
              );
          } else {
             // Optional: If we want to add new rescuers dynamically without fetch
             // But we need name/phone, so maybe better to trigger refetch or ignore
             return prev; 
          }
        });
      };
  
      socket.on('rescuer_moved', handleRescuerMoved);
      socket.on('reconnect', () => {
         // Re-fetching data on reconnect might be good
         fetchData();
      });
  
      return () => {
        socket.off('rescuer_moved', handleRescuerMoved);
        socket.off('reconnect');
      };
    }, [socket]); // Clean dependency list

    // 2. Join Rooms logic (Depends on reports/user changes)
    useEffect(() => {
        if (!socket || !user || user.role !== ENUM_USER_ROLE.USER) return;

        const myActiveReports = reports.filter(r => r.user?._id === user._id && r.status === ENUM_REPORT_STATUS.IN_PROGRESS);
        
        myActiveReports.forEach(report => {
             socket.emit('join_report_room', { reportId: report._id });
        });
    }, [socket, reports, user?._id, user?.role]);

    // 3. Listen for Region Updates (New Reports, Status Updates)
    useEffect(() => {
        if (!socket || !currentRegion) return;

        // Join Region Room to hear about new reports in this area
        socket.emit('join_region', { regionId: currentRegion });

        const handleNewReport = (data: { report: IReportListResponse }) => {
             console.log("New report received via socket:", data.report._id);
             setReports(prev => {
                 if (prev.find(r => r._id === data.report._id)) return prev;
                 return [data.report, ...prev];
             });
        };
        
        const handleReportUpdate = (data: { reportId: string, status: ENUM_REPORT_STATUS, rescuerId?: string }) => {
             setReports(prev => prev.map(r => {
                 if (r._id === data.reportId) {
                     return { 
                        ...r, 
                        status: data.status,
                        rescuer: data.rescuerId ? data.rescuerId : r.rescuer
                     };
                 }
                 return r;
             }));
        };

        const handleReportCancelled = (data: { reportId: string, status: string }) => {
             console.log("Report cancelled via socket:", data.reportId);
             setReports(prev => prev.map(r => {
                 if (r._id === data.reportId) {
                     return { 
                        ...r, 
                        status: ENUM_REPORT_STATUS.PENDING,
                        rescuer: undefined
                     };
                 }
                 return r;
             }));
        };

        socket.on('report_created', handleNewReport);
        socket.on('report_accepted', handleReportUpdate);
        socket.on('report_assigned', handleReportUpdate); // Admin assigned
        socket.on('report_completed', handleReportUpdate);
        socket.on('report_rejected', handleReportUpdate);
        socket.on('report_cancelled', handleReportCancelled);

        return () => {
             // Leave region room when unmounting or changing region
             socket.emit('leave_room', { room: `region_${currentRegion}` });

             socket.off('report_created', handleNewReport);
             socket.off('report_assigned', handleReportUpdate);
             socket.off('report_accepted', handleReportUpdate);
             socket.off('report_completed', handleReportUpdate);
             socket.off('report_rejected', handleReportUpdate);
             socket.off('report_cancelled', handleReportCancelled);
        };
    }, [socket, currentRegion]);

  
    const getShelterMarkers = useMemo(() => {
        return shelters.map((shelter) => (
            <MapShelterMarker
                key={shelter._id}
                id={shelter._id}
                coordinate={[shelter.location.coordinates[0], shelter.location.coordinates[1]]}
                title={shelter.name}
                type={shelter.type}
                status={shelter.status}
                onPress={() => {
                   setSelectedReport(null);
                   setSelectedRescuer(null);
                   setSelectedShelter(shelter);
                }}
            />
        ));
    }, [shelters]);

    const getRescuerMarkers = useMemo(() => {
      return nearbyRescuers.map((rescuer) => (
        <MapRescuerMarker
          key={rescuer._id}
          rescuer={rescuer}
          onSelected={(r) => {
            setSelectedReport(null);
            setSelectedRescuer(r);
            setSelectedShelter(null);
          }}
        />
      ));
    }, [nearbyRescuers]);

    const isVolunteerMode = useMemo(() => {
      return user?.role === ENUM_USER_ROLE.VOLUNTEER || user?.isRescueMode;
    }, [user]);

    // --- LOGIC FILTER REPORTS ---
    const displayedReports = useMemo(() => {
      if (!user) return reports; // Fallback show all while loading user
      const currentUserId = user._id.toString();
      const isAdmin = user.role === ENUM_USER_ROLE.ADMIN || user.role === ENUM_USER_ROLE.SUPER_ADMIN;
  
      // 1. Volunteer Mode (Higher Priority - Focus on Rescue)
      if (isVolunteerMode) {
        // A. Check active task (If has active task, ONLY show it)
        const myActiveReport = reports.find(r => {
          if (r.status !== ENUM_REPORT_STATUS.IN_PROGRESS) return false;
          
          let rRescuerId: string | undefined;
          if (typeof r.rescuer === 'string') {
               rRescuerId = r.rescuer;
          } else if (typeof r.rescuer === 'object' && r.rescuer) {
               rRescuerId = (r.rescuer as any)._id?.toString();
          }

          return rRescuerId === currentUserId;
        });
        
        if (myActiveReport) {
             return [myActiveReport]; // ONLY show my task
        }

        // B. If free, show PENDING reports
        return reports.filter(r => r.status === ENUM_REPORT_STATUS.PENDING);
      }
      
      // 2. User Mode: Show my reports + PENDING/IN_PROGRESS nearby public
      if (user.role === ENUM_USER_ROLE.USER) {
          return reports.filter(r => {
             const isMyReport = r.user?._id === currentUserId;
             const isActive = [ENUM_REPORT_STATUS.PENDING, ENUM_REPORT_STATUS.IN_PROGRESS].includes(r.status as ENUM_REPORT_STATUS);
             return isMyReport || isActive;
          });
      }

      // 3. Admin Mode: Show basic filter
      if (isAdmin) {
         if (filterStatus === "ALL") return reports;
         return reports.filter(r => r.status === filterStatus);
      }

      return reports;
    }, [reports, user, isVolunteerMode, filterStatus]);

    const getReportMarkers = useMemo(() => {
      return displayedReports.map((report) => (
        <MapReportMarker
          key={report._id}
          report={report}
          onSelected={(r) => {
            setSelectedRescuer(null);
            setSelectedReport(r);
            setSelectedShelter(null);
          }}
        />
      ));
    }, [displayedReports]);
  
    const displayedRescuers = useMemo(() => {
      if (!user) return [];
      const isAdmin = user.role === ENUM_USER_ROLE.ADMIN || user.role === ENUM_USER_ROLE.SUPER_ADMIN;
  
      const result = isAdmin ? nearbyRescuers : 
                     user.role === ENUM_USER_ROLE.USER ? (() => {
                        const myActiveVolunteers = reports
                          .filter(r => r.user?._id.toString() === user._id.toString() && r.status === ENUM_REPORT_STATUS.IN_PROGRESS)
                          .map(r => typeof r.rescuer === 'string' ? r.rescuer : r.rescuer?._id.toString());
                        return nearbyRescuers.filter(res => myActiveVolunteers.includes(res._id.toString()));
                     })() : [];
      
      return result;
    }, [nearbyRescuers, reports, user]);




  
    // --- LOCATION TRACKING FOR VOLUNTEER ---
    // Sync active report ID to LocationContext so it sends 'rescuer_moved'
    useEffect(() => {
      if (user?.role === ENUM_USER_ROLE.VOLUNTEER || user?.isRescueMode) {
          const activeReport = reports.find(
              r => r.status === ENUM_REPORT_STATUS.IN_PROGRESS && 
              (typeof r.rescuer === 'string' ? r.rescuer : r.rescuer?._id) === user._id.toString()
          );
          
          if (activeReport) {
              setActiveReportId(activeReport._id);
          } else {
              setActiveReportId(null);
          }
      } else {
          setActiveReportId(null);
      }
    }, [reports, user, setActiveReportId]);
  
    // --- ACTIONS (Xử lý trực tiếp, ko navigate) ---
    const handleReportAction = async (action: "accept" | "reject" | "cancel" | "complete", data?: any) => {
      if (!selectedReport) return;
      setIsActionLoading(true);
      try {
        if (action === "accept") {
          await apiService.post(`/user/report/${selectedReport._id}/accept`, {});
          showSuccess("Đã tiếp nhận!");
          await fetchData();
          setSelectedReport(null);
        } else if (action === "reject") {
            const reason = data?.reason;
            if (reason) {
                  // If reason is provided (from ReportDetailSheet modal), use it directly
                  try {
                      await apiService.post(`/user/report/${selectedReport._id}/reject`, { reason });
                      showSuccess("Đã từ chối báo cáo!");
                      await fetchData();
                      setSelectedReport(null);
                  } catch (e) {
                      showError("Lỗi", "Không thể từ chối báo cáo.");
                  }
                  return;
            }
        } else if (action === "cancel") {
          await apiService.post(`/user/report/${selectedReport._id}/cancel`, {});
          showSuccess("Đã hủy tiếp nhận. Báo cáo sẽ được giao cho người khác.");
          await fetchData();
          setSelectedReport(null);
        } else if (action === "complete") {
          await apiService.post(`/user/report/${selectedReport._id}/complete`, {});
          showSuccess("Nhiệm vụ hoàn thành! Cảm ơn bạn.");
          await fetchData();
          setSelectedReport(null);
        }
  
      } catch (err: any) {
        const message = err?.response?.data?.message;
        if (message === 'report.error.alreadyAccepted' || message === 'report.error.notFound') {
            showError("Thông báo", "Báo cáo này đã được nhận bởi người khác.");
            await fetchData();
            setSelectedReport(null);
        } else if (message === 'report.error.alreadyHasActiveReport') {
            showError("Thông báo", "Bạn đang có nhiệm vụ chưa hoàn thành.");
        } else {
            showError("Lỗi", message || "Không thể thực hiện hành động.");
        }
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
          key={`${theme}-${mountKey}`} // Force remount if theme/key changes to fix GL context issues
          style={styles.map}
          mapStyle={getMapStyleUrl()}
          logoEnabled={false}
          attributionEnabled={false}
          onPress={() => {
            // Clear selections
            setSelectedReport(null);
            setSelectedRescuer(null);
            setSelectedShelter(null);
            
            // Re-fetch
            fetchData();
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
        
        {/* Render Markers */}
        {getReportMarkers}
        {getRescuerMarkers}
        {getShelterMarkers}

        {/* 3. MY LOCATION (Dưới cùng để tránh chặn click của Marker) */}
        {userLocation && (
          <PointAnnotation
            key="user-location-marker"
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
      
      {/* 4. PICKING LOCATION PIN (Overlay - Center of Screen) */}
      {isPickingLocation && (
          <View style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: -24, // adjust half height
              marginLeft: -12, // adjust half width
              zIndex: 100,
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none' // Allow touches to pass through to map
          }}>
              <Icon name="MapPin" size={48} color={colors.primary} fill={colors.primary} />
          </View>
      )}

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

      <View
        style={{
          position: "absolute",
          top: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 50,
          right: 20,
          zIndex: 50,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            showToast({ title: "Đang tải lại...", message: "Đang cập nhật dữ liệu", type: "info" });
            fetchData();
          }}
          disabled={false} // Maybe add loading state block
          style={{
            backgroundColor: theme === "dark" ? colors.neutrals800 : "white",
            padding: 10,
            borderRadius: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Icon name="RotateCw" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

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

      <ReportDetailSheet
          selectedReport={selectedReport}
          onClose={() => setSelectedReport(null)}
          isVolunteerMode={!!isVolunteerMode}
          user={user}
          userLocation={
             userLocation 
             ? { latitude: userLocation.latitude, longitude: userLocation.longitude } 
             : null
          }
          isActionLoading={isActionLoading}
          handleReportAction={handleReportAction}
          handleCall={handleCall}
      />
      
      {selectedRescuer && (
        <RescuerDetailSheet
           selectedRescuer={selectedRescuer}
           onClose={() => setSelectedRescuer(null)}
           handleCall={handleCall}
        />
      )}

      <ShelterDetailSheet
         shelter={selectedShelter}
         onClose={() => setSelectedShelter(null)}
         userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
      />
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

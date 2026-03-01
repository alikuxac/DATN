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
import { UserAvatarMarker } from "@/components/map/UserAvatarMarker";

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

  const DEFAULT_CAMERA_SETTINGS = {
    centerCoordinate: [106.660172, 10.762622],
    zoomLevel: 13
  };

  // No local ReportData interface needed anymore
  
  
  interface RescuerData {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
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

    const getMapStyleUrl = useCallback(() => {
      const mode = theme === "dark" ? "dark" : "light";
      return `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_API_KEY}`;
    }, [theme]);
    
    console.log("[Map] Render - VIETMAP_API_KEY present:", !!VIETMAP_API_KEY, "Length:", VIETMAP_API_KEY.length);
    console.log("[Map] Style URL (masked):", getMapStyleUrl().replace(VIETMAP_API_KEY, "REDACTED"));
    
    useFocusEffect(
      useCallback(() => {
         console.log("[Map] Screen focused.");
         fetchData();
      }, [token, currentRegion, user?.role, user?.verification?.email])
    );

    useEffect(() => {
      if (Platform.OS === "web") {
        router.replace("/(tabs)/account");
      }
    }, []);
  
    if (Platform.OS === "web") return null; // Render nothing on web while redirecting
  
    // --- STATE ---
    const [reports, setReports] = useState<IReportListResponse[]>([]);
    // Derived State instead of manual sync
    // const [nearbyRescuers, setNearbyRescuers] = useState<RescuerData[]>([]); // REPLACED BY MEMO
    // const [activeReporter, setActiveReporter] = useState<RescuerData | null>(null); // REPLACED BY MEMO
    
    // Real-time location overrides from Socket
    const [rescuerLocations, setRescuerLocations] = useState<Record<string, { lat: number, lng: number, lastLocationAt: string }>>({});
    const [shelters, setShelters] = useState<Shelter[]>([]);

    const isVolunteerMode = useMemo(() => {
      return user?.role === ENUM_USER_ROLE.VOLUNTEER || user?.isRescueMode;
    }, [user]);
    
    // Selection State
    const [selectedReport, setSelectedReport] = useState<IReportListResponse | null>(null);
    const [selectedRescuer, setSelectedRescuer] = useState<RescuerData | null>(null);
    const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
    
    // UI State
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    
    const [isFocusMode, setIsFocusMode] = useState(true);
    
    // Location Picker State
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [pickedLocation, setPickedLocation] = useState<{ lat: number; long: number } | null>(null);
    const centerCoordinateRef = useRef<[number, number] | null>(null);
    const userHasMovedMapRef = useRef(false);
    
    // Params handling
    const params = useLocalSearchParams<{ lat: string; long: string; focus: string }>();
  
    // --- NAVIGATION FOCUS LOGIC (Fly to report from other screens) ---
    const lastHandledFocusRef = useRef<string | null>(null);

    useEffect(() => {
        // Only fly to location if focus param is new and valid
        if (params.focus && params.focus !== lastHandledFocusRef.current && cameraRef.current) {
            const lat = parseFloat(params.lat);
            const long = parseFloat(params.long);
            
            if (!isNaN(lat) && !isNaN(long)) {
                 lastHandledFocusRef.current = params.focus;
                 
                 // Mark that we have already handled the initial camera positioning
                 hasCenteredRef.current = true;
                 userHasMovedMapRef.current = true; // Treat programmatic focus as a move to prevent auto-return
                 
                 // Small timeout to ensure Map is ready for the animation
                 setTimeout(() => {
                     cameraRef.current?.setCamera({
                          centerCoordinate: [long, lat],
                          zoomLevel: 16,
                          animationDuration: 1200,
                          animationMode: "flyTo"
                     });
                 }, 500);

                 // Silently clear params so they don't re-trigger on state changes
                 router.setParams({ focus: "", lat: "", long: "" });
            }
        }
    }, [params.focus, params.lat, params.long]);
  
    // Auto-center on user location when first loaded (if not focused/navigated to specific report)
    // --- REFACTOR: CAMERA CONTROL ---
    const hasCenteredRef = useRef(false);

    // 1. Initial Auto-Center on User Location
    // Only runs ONCE when userLocation is first available, unless user has already moved the map or focused elsewhere.
    useEffect(() => {
        // Stop if we already centered once OR user interacted with the map
        if (hasCenteredRef.current || userHasMovedMapRef.current) return;

        // Skip if we are currently handling a navigation focus (wait for that fly-to)
        if (params.focus && params.lat && params.long) return;

        // CRITICAL: Do not auto-center if user has selected a marker
        if (selectedReport || selectedRescuer || selectedShelter) return;

        if (userLocation) {
            // Set to true immediately to prevent duplicate triggers
            hasCenteredRef.current = true;

            // 1s delay to allow Map View stable after render/login
            const timeoutId = setTimeout(() => {
                cameraRef.current?.setCamera({
                    centerCoordinate: [userLocation.longitude, userLocation.latitude],
                    zoomLevel: 15,
                    animationDuration: 2000, // Smooth fly-in effect
                    animationMode: "flyTo"
                });
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [userLocation, params.focus, selectedReport, selectedRescuer, selectedShelter]);
  
    // --- MAP STYLE ---
      
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
        const param: Record<string, any> = {
            _limit: 1000,
            orderBy: 'createdAt',
            orderDirection: 'desc'
        };
        // Remove strict region filtering to allow seeing reports across region borders (client filters by 50km)
        // if (currentRegion) {
        //   param.regionId = currentRegion;
        // }
  
        const queryString = new URLSearchParams(param).toString();
  
        console.log("Query String:", queryString);

        // 1. Fetch Reports
        const reportRes = await apiService.get<{ data: IReportListResponse[] }>(
          `/user/report?${queryString}`
        );
        const uniqueReports = Array.from(new Map((reportRes.data || []).map(r => [r._id, r])).values());
        setReports(uniqueReports);

          // 3. Fetch all shelters
         

       } catch (error) {
          console.error("Error fetching map data:", error);
          // showError("Lỗi tải dữ liệu", "Không thể cập nhật danh sách báo cáo.");
       } finally {
          setIsLoading(false);
       }
    };
  
    // --- SOCKET LOGIC ---
    
    // Stable function to join rooms based on current state
    const joinedRoomsRef = useRef<Set<string>>(new Set());

    const syncSocketRooms = useCallback(() => {
        if (!socket || !socket.connected) return;

        // 1. Join Region Room
        if (currentRegion) {
            const regionRoom = `region_${currentRegion}`;
            if (!joinedRoomsRef.current.has(regionRoom)) {
                socket.emit('join_region', { regionId: currentRegion });
                joinedRoomsRef.current.add(regionRoom);
            }
        }

        // 2. Join Report Rooms (Active ones)
        const activeReports = reports.filter(r => 
            r.status === ENUM_REPORT_STATUS.PENDING || 
            r.status === ENUM_REPORT_STATUS.IN_PROGRESS
        );
        
        activeReports.forEach(report => {
            const reportRoom = `report_${report._id}`;
            if (!joinedRoomsRef.current.has(reportRoom)) {
                socket.emit('join_report_room', { reportId: report._id });
                joinedRoomsRef.current.add(reportRoom);
            }
        });
    }, [socket, currentRegion, reports]);

    // Handle Connection & Global Listeners
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            console.log("Socket connected/reconnected - syncing rooms...");
            joinedRoomsRef.current.clear(); // Clear local tracking to force re-joins
            syncSocketRooms();
            fetchData();
        };

        const handleUserMoved = (data: { userId: string, lat: number, lng: number }) => {
            setRescuerLocations(prev => ({
                ...prev,
                [data.userId]: {
                    lat: data.lat,
                    lng: data.lng,
                    lastLocationAt: new Date().toISOString()
                }
            }));
        };

        const handleNewReport = (data: { report: IReportListResponse }) => {
            setReports(prev => {
                if (prev.find(r => r._id === data.report._id)) return prev;
                return [data.report, ...prev];
            });
        };

        const handleReportUpdate = (data: { reportId: string, status: ENUM_REPORT_STATUS, rescuerId?: string }) => {
            setReports(prev => prev.map(r => {
                if (r._id === data.reportId) {
                    let currentRescuers = r.rescuers || [];
                    if (data.rescuerId) {
                        const exists = currentRescuers.some(ex => {
                            const exId = typeof ex === 'string' ? ex : ex._id;
                            return exId === data.rescuerId;
                        });
                        if (!exists) {
                          currentRescuers = [...currentRescuers, data.rescuerId];
                        }
                    }
                    return { ...r, status: data.status, rescuers: currentRescuers };
                }
                return r;
            }));
        };

        const handleReportCancelled = (data: { reportId: string, status: string }) => {
            setReports(prev => prev.map(r => {
                if (r._id === data.reportId) {
                    const isPending = data.status === ENUM_REPORT_STATUS.PENDING;
                    return { 
                        ...r, 
                        status: data.status as ENUM_REPORT_STATUS,
                        rescuers: isPending ? [] : r.rescuers
                    };
                }
                return r;
            }));
        };

        // Attach listeners
        socket.on('connect', handleConnect);
        socket.on('reconnect', handleConnect);
        socket.on('report_created', handleNewReport);
        socket.on('report_accepted', (data: any) => { handleReportUpdate(data); fetchData(); });
        socket.on('report_assigned', handleReportUpdate);
        socket.on('report_completed', handleReportUpdate);
        socket.on('report_rejected', handleReportUpdate);
        socket.on('report_cancelled', handleReportCancelled);
        socket.on('rescuer_moved', (data: any) => handleUserMoved({ userId: data.rescuerId, ...data }));
        socket.on('reporter_moved', (data: any) => handleUserMoved({ userId: data.reporterId, ...data }));

        // Initial Sync
        if (socket.connected) {
            syncSocketRooms();
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('reconnect', handleConnect);
            socket.off('report_created', handleNewReport);
            socket.off('report_assigned', handleReportUpdate);
            socket.off('report_accepted');
            socket.off('report_completed', handleReportUpdate);
            socket.off('report_rejected', handleReportUpdate);
            socket.off('report_cancelled', handleReportCancelled);
            socket.off('rescuer_moved');
            socket.off('reporter_moved');
        };
    }, [socket]); // Listener effect only depends on socket object

    // Sync rooms when reports or region changes
    useEffect(() => {
        syncSocketRooms();
    }, [syncSocketRooms]);


    const nearbyRescuers = useMemo(() => {
         // Lọc các report đang IN_PROGRESS
         let activeReports = reports.filter(r => 
             r.status === ENUM_REPORT_STATUS.IN_PROGRESS && r.rescuers && r.rescuers.length > 0
         );

         // Nếu đang bật Focus Mode, chỉ quan tâm đến những người tham gia cùng report với mình
         if (isFocusMode && user) {
             const userId = user._id.toString();
             activeReports = activeReports.filter(r => {
                 // Tôi là rescuer của report này
                 const amIRescuer = r.rescuers?.some((resc: any) => (typeof resc === 'string' ? resc : resc._id) === userId);
                 // Tôi là tác giả (Reporter) của report này
                 const amIReporter = (typeof r.user === 'object' ? r.user?._id : r.user)?.toString() === userId;
                 
                 return amIRescuer || amIReporter;
             });
         }
         
         const extracted: RescuerData[] = [];
         activeReports.forEach((r) => {
             if (!r.rescuers) return;
             r.rescuers.forEach((rescuer: any) => {
                if (rescuer && typeof rescuer === 'object' && rescuer._id) {
                    const realtime = rescuerLocations[rescuer._id.toString()];
                    const coords = realtime ? [realtime.lng, realtime.lat] : rescuer.location?.coordinates;
                    
                    extracted.push({
                        _id: rescuer._id.toString(),
                        firstName: rescuer.firstName,
                        lastName: rescuer.lastName,
                        phone: rescuer.mobileNumber,
                        avatar: rescuer.avatar,
                        location: coords ? { lat: coords[1], lng: coords[0] } : { lat: 0, lng: 0 },
                        coordinates: coords,
                        isOnline: true,
                        lastLocationAt: realtime?.lastLocationAt || rescuer.lastLocationAt 
                    });
                }
             });
         });
         
         return Array.from(new Map(extracted.map(item => [item._id, item])).values());
    }, [reports, rescuerLocations, isFocusMode, user?._id]);

    // --- DERIVED STATE: Active Reporter (For Volunteers) ---
    const activeReporter = useMemo(() => {
        if (!isVolunteerMode || !user) return null;

        const myActiveReport = reports.find(r => 
            r.status === ENUM_REPORT_STATUS.IN_PROGRESS && 
            r.rescuers?.some((resc: any) => {
                const rid = typeof resc === 'string' ? resc : resc?._id?.toString();
                return rid === user._id?.toString();
            })
        );

        if (myActiveReport && myActiveReport.user && typeof myActiveReport.user === 'object') {
            const reporter = myActiveReport.user as any;
            const realtime = rescuerLocations[reporter._id.toString()];
            const coords = realtime ? [realtime.lng, realtime.lat] : reporter.location?.coordinates;
            
            return {
                _id: reporter._id.toString(),
                firstName: reporter.firstName,
                lastName: reporter.lastName,
                phone: reporter.mobileNumber,
                avatar: reporter.avatar,
                location: coords ? { lat: coords[1], lng: coords[0] } : { lat: 0, lng: 0 },
                coordinates: coords,
                isOnline: true,
                lastLocationAt: realtime?.lastLocationAt || reporter.lastOnlineAt
            };
        }
        return null;
    }, [reports, user, isVolunteerMode, rescuerLocations]);

    // const getShelterMarkers = useMemo(() => {
    //   // console.log("visible",shelters.length);
    //   //   let visibleShelters = shelters;
    //   //   if (userLocation) {
    //   //        visibleShelters = shelters.filter(s => {
    //   //            const [lng, lat] = s.location.coordinates; // GeoJSON: [lng, lat]
    //   //            const dist =calculateDistance(userLocation.latitude, userLocation.longitude, lat, lng);
    //   //           //  console.log('shelter:', dist)
    //   //            return dist <= 30000;
    //   //        });
    //   //   }

    //   //   console.log('visibleShelters', visibleShelters.length)

    //     return shelters.map((shelter) => (
    //         <MapShelterMarker
    //             key={`shelter-${shelter._id}`}
    //             id={shelter._id}
    //             coordinate={[shelter.location.coordinates[0], shelter.location.coordinates[1]]}
    //             title={shelter.name}
    //             type={shelter.type}
    //             status={shelter.status}
    //             onPress={() => {
    //                userHasMovedMapRef.current = true; // User interacted
    //                setSelectedReport(null);
    //                setSelectedRescuer(null);
    //                setSelectedShelter(shelter);
    //             }}
    //         />
    //     ));
    // }, [shelters]);

    const busyRescuerIds = useMemo(() => {
      const ids = new Set<string>();
      reports.forEach(r => {
        if (r.status === ENUM_REPORT_STATUS.IN_PROGRESS && r.rescuers) {
          r.rescuers.forEach((resc: any) => {
              const rescuerId = typeof resc === 'string' ? resc : resc?._id?.toString();
              if (rescuerId) ids.add(rescuerId);
          });
        }
      });
      return ids;
    }, [reports]);

    const getRescuerMarkers = useMemo(() => {
      const myRescuerIds = new Set<string>();
      if (user?.role === ENUM_USER_ROLE.USER) {
        reports.forEach(r => {
          if (r.user?._id === user._id && r.status === ENUM_REPORT_STATUS.IN_PROGRESS && r.rescuers) {
            r.rescuers.forEach((resc: any) => {
                 const rescuerId = typeof resc === 'string' ? resc : resc?._id?.toString();
                 if (rescuerId) myRescuerIds.add(rescuerId);
            });
          }
        });
      }

      return nearbyRescuers
        .filter(r => {
          const rid = r._id?.toString();
          const isMe = rid === user?._id?.toString();
          const isActiveReporter = rid === activeReporter?._id?.toString();
          return !isMe && !isActiveReporter;
        })
        .map((rescuer) => {
        const isMyRescuer = myRescuerIds.has(rescuer._id);
        
        if (isMyRescuer) {
          const coords: [number, number] = [
            rescuer.location?.lng ?? rescuer.coordinates?.[0] ?? 0,
            rescuer.location?.lat ?? rescuer.coordinates?.[1] ?? 0
          ];
          return (
            <UserAvatarMarker
              key={`rescuer-avatar-${rescuer._id}`}
              userId={rescuer._id}
              id={`rescuer-avatar-${rescuer._id}`}
              coordinate={coords}
              avatarUrl={(rescuer as any).avatar}
              userName={`${rescuer.firstName || ''} ${rescuer.lastName || ''}`}
              onSelected={() => {
                setSelectedReport(null);
                setSelectedRescuer(rescuer);
                setSelectedShelter(null);
              }}
            />
          );
        }
        
        return (
          <MapRescuerMarker
            key={`rescuer-${rescuer._id}`}
            rescuer={rescuer}
            isBusy={busyRescuerIds.has(rescuer._id)}
            onSelected={(r) => {
              setSelectedReport(null);
              setSelectedRescuer(r);
              setSelectedShelter(null);
            }}
          />
        );
      });
    }, [nearbyRescuers, busyRescuerIds, reports, user, activeReporter]);

    // --- LOGIC FILTER REPORTS ---
    const displayedReports = useMemo(() => {
      if (!user) return [];
      
      const currentUserId = user._id?.toString();
      const isManualFilter = filterStatus !== "ALL";

      if (isManualFilter) {
          return reports.filter(r => r.status === filterStatus);
      }

      // Helper to match rescuer
      const isMyRescuerTask = (r: any) => 
          r.rescuers && Array.isArray(r.rescuers) && r.rescuers.some((resc: any) => {
              const rid = typeof resc === 'string' ? resc : (resc?._id || resc?.id)?.toString();
              return rid === currentUserId;
          });

      // Helper to match owner
      const isMyOwnReport = (r: any) => 
          (typeof r.user === 'object' ? r.user?._id : r.user)?.toString() === currentUserId;

      // 1. "Focus Mode" logic -> Prioritize Active mission
      if (isFocusMode) {
          const myActiveTask = reports.find(r => 
              r.status === ENUM_REPORT_STATUS.IN_PROGRESS && 
              (isVolunteerMode ? isMyRescuerTask(r) : isMyOwnReport(r))
          );
          
          if (myActiveTask) {
              return [myActiveTask];
          }
      } 

      // 2. Normal / Search mode -> Apply 50km filter
      const filtered = reports.filter(r => {
           // ALWAYS show my active missions regardless of distance
           if (r.status === ENUM_REPORT_STATUS.IN_PROGRESS && (isMyRescuerTask(r) || isMyOwnReport(r))) {
               return true;
           }

           if (!userLocation) return true;

           // Coordinate extraction - Prioritize flat coordinates like reports.tsx
           const rLat = r.coordinates?.[1] ?? r.location?.coordinates?.[1] ?? (r as any).lat;
           const rLng = r.coordinates?.[0] ?? r.location?.coordinates?.[0] ?? (r as any).lng;
           
           if (typeof rLat !== 'number' || typeof rLng !== 'number') {
               console.log("Invalid coords for report:", r._id, rLat, rLng);
               return false;
           }
           
           const dist = calculateDistance(
               userLocation.latitude, 
               userLocation.longitude, 
               rLat, 
               rLng
           );
           
           // DEBUG: Print diff for close reports to verify
           if (dist < 60000 && dist > 40000) console.log(`Report ${r._id} dist: ${dist}`);

           return dist <= 50000; // 50km
      });

      console.log(`[Map] Total: ${reports.length}, Displayed: ${filtered.length}. Focus: ${isFocusMode}`);
      return filtered;
    }, [reports, user, filterStatus, isVolunteerMode, userLocation, isFocusMode]);

    const getReportMarkers = useMemo(() => {
      // 1. Group reports by location to handle stacking
      const groupedReports = new Map<string, typeof displayedReports>();
      
      displayedReports.forEach(report => {
         const lat = report.location?.coordinates?.[1] ?? report.coordinates?.[1] ?? (report as any).lat;
         const lng = report.location?.coordinates?.[0] ?? report.coordinates?.[0] ?? (report as any).lng;
         
         if (lat !== undefined && lng !== undefined) {
             // Create a unique key for this location (rounded slightly to catch near-exact matches if needed, but exact is fine for overlaps)
             // Using exact distinct coordinates for now.
             const key = `${lat},${lng}`;
             if (!groupedReports.has(key)) {
                 groupedReports.set(key, []);
             }
             groupedReports.get(key)?.push(report);
         }
      });

      // 2. Render Markers for each Group
      return Array.from(groupedReports.entries()).map(([key, group]) => {
          const report = group[0]; // Representative report (the top one)
          return (
            <MapReportMarker
              key={`report-group-${key}-${report._id}`}
              report={report}
              count={group.length} // Pass count for badge
              onSelected={(r) => {
                userHasMovedMapRef.current = true; // User interacted
                setSelectedRescuer(null);
                setSelectedReport(r); // Select the representative
                setSelectedShelter(null);
              }}
            />
          );
      });
    }, [displayedReports]);
  
    const displayedRescuers = useMemo(() => {
      if (!user) return [];
      const isAdmin = user.role === ENUM_USER_ROLE.ADMIN || user.role === ENUM_USER_ROLE.SUPER_ADMIN;
  
      const result = isAdmin ? nearbyRescuers : 
                     user.role === ENUM_USER_ROLE.USER ? (() => {
                      return reports
                          .filter(r => r.user?._id?.toString() === user._id?.toString() && r.status === ENUM_REPORT_STATUS.IN_PROGRESS)
                          .flatMap(r => r.rescuers ? r.rescuers.map(resc => typeof resc === 'string' ? resc : resc._id?.toString()) : []);
                        // return nearbyRescuers.filter(res => myActiveVolunteers.includes(res._id.toString()));
                     })() : [];
      
      return result;
    }, [nearbyRescuers, reports, user]);




  
    // --- LOCATION TRACKING SYNC ---
    // Sync active report ID to LocationContext so it sends 'update_location' with context
    useEffect(() => {
      if (!user) return;

      if (isVolunteerMode) {
          const activeReport = reports.find(
              r => r.status === ENUM_REPORT_STATUS.IN_PROGRESS && 
              r.rescuers?.some(resc => (typeof resc === 'string' ? resc : resc?._id?.toString()) === user._id?.toString())
          );
          setActiveReportId(activeReport?._id || null);
      } else if (user.role === ENUM_USER_ROLE.USER) {
          const activeReport = reports.find(
              r => r.status === ENUM_REPORT_STATUS.IN_PROGRESS && 
              r.user?._id?.toString() === user._id?.toString()
          );
          setActiveReportId(activeReport?._id || null);
      } else {
          setActiveReportId(null);
      }
    }, [reports, user, isVolunteerMode, setActiveReportId]);
  
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
          zoomLevel: 15,
          animationDuration: 1000,
          animationMode: "flyTo",
        });
      } else {
        showError("Chưa có vị trí", "Đang định vị...");
      }
    };
  
    const onMapPress = useCallback(() => {
        userHasMovedMapRef.current = true;
        setSelectedReport(null);
        setSelectedRescuer(null);
        setSelectedShelter(null);
        fetchData();
    }, []);

    const onRegionChanged = useCallback((event: any) => {
        if (event?.properties?.isUserInteraction) {
            userHasMovedMapRef.current = true;
        }
        if (event?.geometry?.coordinates) {
            centerCoordinateRef.current = event.geometry.coordinates as [number, number];
        }
    }, []);

    return (
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
  
        <MapView
          key={theme}
          style={styles.map}
          mapStyle={getMapStyleUrl()}
          logoEnabled={false}
          attributionEnabled={false}
          onPress={onMapPress}
          onRegionDidChange={onRegionChanged}
          onDidFinishLoadingStyle={() => console.log("[Map] Style loaded successfully")}
          onDidFailLoadingMap={() => console.error("[Map] Failed to load map")}
        >
        <Camera
          ref={cameraRef}
          defaultSettings={DEFAULT_CAMERA_SETTINGS}
          animationMode="flyTo"
        />

        {/* Render Markers - Order: Shelter (Low) -> Rescuer -> Report (High) */}
        {/* {getShelterMarkers} */}
        {getRescuerMarkers}
        {getReportMarkers}

        {/* 4. ACTIVE REPORTER (For Volunteer view) */}
        {activeReporter && isVolunteerMode && (
          <UserAvatarMarker
            key={`active-reporter-${activeReporter._id}`}
            id={`active-reporter-${activeReporter._id}`}
            userId={activeReporter._id}
            coordinate={[activeReporter.location.lng, activeReporter.location.lat]}
            avatarUrl={(activeReporter as any).avatar}
            userName={`${activeReporter.firstName || ''} ${activeReporter.lastName || ''}`}
              onSelected={() => {
                userHasMovedMapRef.current = true; // User interacted
                setSelectedReport(null);
                setSelectedRescuer(activeReporter);
                setSelectedShelter(null);
              }}
          />
        )}

        {/* 3. MY LOCATION - Avatar thay vì blue dot */}
        {userLocation && user && (
          <UserAvatarMarker
            key={`my-location-${user._id}`}
            id={`my-location-${user._id}`}
            userId={user._id}
            coordinate={[userLocation.longitude, userLocation.latitude]}
            avatarUrl={user.avatar}
            userName={`${user.firstName || ''} ${user.lastName || ''}`}
          />
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
          onLongPress={() => showToast({ title: "Làm mới", message: "Tải lại dữ liệu bản đồ", type: "info" })}
          style={{
            backgroundColor: theme === "dark" ? colors.neutrals800 : "white",
            padding: 10,
            borderRadius: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            marginBottom: 10,
          }}
        >
          <Icon name="RotateCw" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsFocusMode(!isFocusMode)}
          onLongPress={() => showToast({ 
              title: "Chế độ tập trung", 
              message: isFocusMode ? "Đang bật: Chỉ hiện nhiệm vụ của tôi" : "Đang tắt: Hiện tất cả báo cáo gần đây", 
              type: "info" 
          })}
          style={{
            backgroundColor: isFocusMode ? colors.primary : (theme === "dark" ? colors.neutrals800 : "white"),
            padding: 10,
            borderRadius: 25,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            marginBottom: 10,
          }}
        >
          <Icon 
            name={isFocusMode ? "Crosshair" : "Layers"} 
            size={20} 
            color={isFocusMode ? "white" : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* --- CREATE BUTTON (User/Volunteer) --- */}
      {!isPickingLocation && user?.role !== ENUM_USER_ROLE.ADMIN && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            onLongPress={() => showToast({ title: "Tạo báo cáo", message: "Gửi yêu cầu cứu trợ khẩn cấp", type: "info" })}
            style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          >
            <Plus color="white" size={32} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRecenter}
            onLongPress={() => showToast({ title: "Vị trí của bạn", message: "Quay về vị trí hiện tại", type: "info" })}
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

      {selectedReport && (
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
      )}
      
      {selectedRescuer && (
        <RescuerDetailSheet
           selectedRescuer={selectedRescuer}
           onClose={() => setSelectedRescuer(null)}
           handleCall={handleCall}
        />
      )}

      {selectedShelter && (
        <ShelterDetailSheet
           shelter={selectedShelter}
           onClose={() => setSelectedShelter(null)}
           userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
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

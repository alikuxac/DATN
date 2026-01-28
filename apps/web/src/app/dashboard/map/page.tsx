"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Report, ApiResponse, ReportStatus, ReportType, UserListResponse, UserRole } from "@/types";
import { Loader2, Search, ListFilter, Users, FileText, Activity, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { AssignVolunteerDialog } from "@/components/dashboard/map/AssignVolunteerDialog";
import { useAuth } from "@/hooks/useAuth";

// Placeholder for Vietmap API Key
const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "YOUR_VIETMAP_API_KEY";

type MapMode = "reports" | "users" | "volunteers" | "all";

// Extend User type locally if needed (assuming shared type might miss location)
// Extend User type locally if needed (assuming shared type might miss location)
interface MapUser extends Omit<UserListResponse, 'lastLocationAt'> {
    location?: { type: string; coordinates: number[] };
    lastLocationAt?: string | Date;
}

// Shelter interface for map display
interface MapShelter {
    _id: string;
    name: string;
    type: 'EVACUATION' | 'WAREHOUSE' | 'MEDICAL' | 'TEMPORARY';
    status: 'ACTIVE' | 'INACTIVE' | 'FULL' | 'CLOSED';
    location: { type: string; coordinates: number[] };
    address: string;
    capacity?: number;
    currentOccupancy?: number;
    contactPerson?: string;
    contactPhone?: string;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);
  const myMarkerRef = useRef<vietmapgl.Marker | null>(null);
  // Store selected entity to track interactions
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; type: 'report' | 'user' | 'volunteer' } | null>(null);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [mapMode, setMapMode] = useState<MapMode>("reports");
  
  // Report Filters
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  const [assignReportId, setAssignReportId] = useState<string | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showShelters, setShowShelters] = useState(true); // Toggle shelter visibility
  const { t } = useLanguage();

  // Fetch Reports
  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['map-reports', debouncedSearch, reportTypeFilter, reportStatusFilter],
    queryFn: async () => {
      const params: any = { limit: 100, page: 1 };
      if (debouncedSearch) params.q = debouncedSearch;
      if (reportTypeFilter !== "all") params.type = reportTypeFilter;
      if (reportStatusFilter !== "all") params.status = reportStatusFilter;

      const { data } = await api.get<ApiResponse<Report[]>>('/admin/report/list', { params });
      return data.data || [];
    },
    enabled: mapMode === "reports" || mapMode === "all",
  });

  // Fetch Users/Volunteers
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['map-users', mapMode],
    queryFn: async () => {
      const params: any = { limit: 500, page: 1 }; 
      // In a real scenario, we might want a specific endpoint for map data to reduce payload size
      // For now, list users and filter client side or assume backend returns location
      
      const { data } = await api.get<ApiResponse<MapUser[]>>('/admin/user/list', { params });
      return data.data || [];
    },
    enabled: mapMode !== "reports", // Fetch if asking for users, volunteers or all
  });

  // Fetch Shelters
  const { data: sheltersData, isLoading: isLoadingShelters } = useQuery({
    queryKey: ['map-shelters'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MapShelter[]>>('/admin/shelter/list', { 
        params: { limit: 100, page: 1 } 
      });
      return data.data || [];
    },
    enabled: showShelters,
  });

  // Shelter markers ref (separate from other markers)
  const shelterMarkersRef = useRef<vietmapgl.Marker[]>([]);

  // Filter & Search State
  // Helper to safely get rescuer ID
  const getRescuerId = (r: Report) => typeof r.rescuer === 'string' ? r.rescuer : (r.rescuer as any)?._id || (r.rescuer as any)?.id;

  // Filter Data for Display
  const displayData = useMemo(() => {
    const items: { type: 'report' | 'user' | 'volunteer'; data: any, coords: [number, number] }[] = [];

    // Identify Related ID based on Selected Entity
    let relatedId: string | null = null;
    if (selectedEntity && reportsData) {
        if (selectedEntity.type === 'report') {
            const report = reportsData.find(r => r._id === selectedEntity.id);
            if (report?.status === ReportStatus.IN_PROGRESS) relatedId = getRescuerId(report);
        } else if (selectedEntity.type === 'volunteer') {
             const report = reportsData.find(r => getRescuerId(r) === selectedEntity.id && r.status === ReportStatus.IN_PROGRESS);
             if (report) relatedId = report._id;
        }
    }

    // Process Reports
    if (reportsData) {
      reportsData.forEach(r => {
        // Filter out RESOLVED and REJECTED
        if (r.status === ReportStatus.RESOLVED || r.status === ReportStatus.REJECTED) return;

        const isModeMatch = mapMode === "reports" || mapMode === "all";
        const isRelated = r._id === relatedId;
        const isSelected = selectedEntity?.id === r._id;

        if ((isModeMatch || isRelated || isSelected) && r.location?.coordinates?.length === 2) {
          items.push({ type: 'report', data: r, coords: r.location.coordinates as [number, number] });
        }
      });
    }

    // Process Users
    if (usersData) {
       usersData.forEach(u => {
          if (u.location?.coordinates?.length === 2) {
              const role = u.role === UserRole.VOLUNTEER ? 'volunteer' : 'user';
              const uId = (u as any)._id || (u as any).id;
              
              const isModeMatch = mapMode === "all" || (mapMode === "users" && role === "user") || (mapMode === "volunteers" && role === "volunteer");
              const isRelated = uId === relatedId;
              const isSelected = selectedEntity?.id === uId;

              if (isModeMatch || isRelated || isSelected) {
                  items.push({ type: role as 'user' | 'volunteer', data: u, coords: u.location.coordinates as [number, number] });
              }
          }
       });
    }

    return items;
  }, [mapMode, reportsData, usersData, selectedEntity]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Prevent double initialization (React Strict Mode or fast re-renders)
    if (mapRef.current || mapContainerRef.current.childNodes.length > 0) return;

    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: "https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=" + VIETMAP_API_KEY,
      center: [105.854444, 21.028511],
      zoom: 12,
    });
    
    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    map.addControl(new vietmapgl.FullscreenControl(), "top-right");
    
    const geolocateControl = new vietmapgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true
    });
    map.addControl(geolocateControl, "bottom-right");

    mapRef.current = map;
    
    map.on('load', () => {
        map.resize();
        geolocateControl.trigger();
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    (window as any).dispatchReport = (id: string) => {
        setAssignReportId(id);
    };
    return () => {
        delete (window as any).dispatchReport;
    }
  }, []);

  // Create/update my location marker with avatar
  useEffect(() => {
    if (!mapRef.current || !myLocation || !user) return;

    // Remove old marker
    if (myMarkerRef.current) {
      myMarkerRef.current.remove();
    }

    // Create avatar marker element
    const container = document.createElement('div');
    container.className = 'my-avatar-marker';
    container.innerHTML = `
      <div style="position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
        <!-- Direction cone -->
        <div style="position: absolute; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
          <svg width="60" height="60" viewBox="0 0 100 100" style="position: absolute;">
            <path d="M 50 50 L 30 20 A 28 28 0 0 1 70 20 Z" fill="rgba(147, 51, 234, 0.25)" stroke="rgba(147, 51, 234, 0.4)" stroke-width="1.5"/>
          </svg>
        </div>
        <!-- Avatar circle -->
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 3px solid #fff;
          z-index: 2;
        ">
          <img 
            src="${user.data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.data.firstName} ${user.data.lastName}`}"
            alt="Me"
            style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;"
          />
        </div>
      </div>
    `;

    const marker = new vietmapgl.Marker({ element: container })
      .setLngLat([myLocation.lng, myLocation.lat])
      .addTo(mapRef.current!);

    myMarkerRef.current = marker;

    return () => {
      if (myMarkerRef.current) {
        myMarkerRef.current.remove();
        myMarkerRef.current = null;
      }
    };
  }, [myLocation, user]);

  // Get my location from browser geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // List of Volunteer IDs who are currently busy (assigned to an IN_PROGRESS report)
    // Note: This relies on loaded reports. Ideally, backend should provide status.
    const busyVolunteerIds = new Set<string>();
    if (reportsData) {
        reportsData.forEach(r => {
            if (r.status === ReportStatus.IN_PROGRESS && r.rescuer) {
                // Safely get volunteer ID - handles string or populated object
                const volId = typeof r.rescuer === 'string' ? r.rescuer : (r.rescuer as any)?._id || (r.rescuer as any)?.id;
                if (volId) busyVolunteerIds.add(volId);
            }
        });
    }

    displayData.forEach((item) => {
      // Create Container (No transform transition here to avoid conflict with Mapbox/Vietmap positioning)
      const containerRel = document.createElement('div');
      containerRel.className = 'marker-container group relative'; // group for potential tooltip
      
      // Create Visual Element (Inner circle that scales)
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-[10px] font-bold text-white transition-transform duration-200 transform hover:scale-125';
      
      containerRel.appendChild(el);
      
      let color = '#6b7280';
      let popupContent = '';
      let itemId = '';

      if (item.type === 'report') {
          const report = item.data as Report;
          itemId = report._id;
          const isGuest = (report as any).source === 'GUEST';
          
          if (isGuest) {
             color = '#9333ea'; 
          } else {
             if (report.status === ReportStatus.PENDING) color = '#ef4444'; 
             else if (report.status === ReportStatus.IN_PROGRESS) color = '#f59e0b'; 
          }

          let guestPhone = 'N/A';
          if (isGuest && report.notes) {
              const match = report.notes?.match(/Guest Phone: ([\d+]+)/);
              if (match) guestPhone = match[1];
          }

          // Translations
          const sourceText = isGuest ? t('REPORTS.SOURCE_GUEST') : t('REPORTS.SOURCE_APP');
          const statusText = t(`REPORTS.STATUS.${report.status}`);
          const typeText = t(`REPORTS.TYPE_OPTIONS.${report.type?.toLowerCase()}`) || report.type;
          const phoneLabel = t('REPORTS.PHONE');
          const userLabel = t('REPORTS.USER');
          const severityLabel = t('REPORTS.SEVERITY');
          const severityValue = t(`REPORTS.SEVERITIES.${report.severity || 'low'}`);
          const processingText = t('REPORTS.PROCESSING_BY');
          const dispatchText = t('REPORTS.DISPATCH_VOLUNTEER');
          const viewDetailsText = t('REPORTS.VIEW_DETAILS');

          popupContent = `
            <div class="p-4 w-60 font-sans">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isGuest ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} uppercase tracking-wider">
                        ${sourceText ? sourceText.toUpperCase() : (isGuest ? 'GUEST' : 'APP')}
                    </span>
                    <span class="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">${statusText}</span>
                </div>
                
                <h3 class="font-bold text-base mb-2 text-gray-800 leading-tight">${typeText ? typeText.toUpperCase() : 'REPORT'}</h3>
                
                ${isGuest ? `
                    <div class="mb-3 p-2.5 bg-purple-50 rounded-md text-xs border border-purple-100">
                        <p class="font-semibold text-purple-900 mb-0.5 flex items-center gap-1">📞 ${phoneLabel}:</p>
                        <a href="tel:${guestPhone}" class="text-blue-600 hover:text-blue-800 hover:underline font-bold text-sm block">${guestPhone}</a>
                    </div>
                ` : `
                    <div class="mb-3 p-2.5 bg-gray-50 rounded-md text-xs border border-gray-100">
                        <p class="font-semibold text-gray-700 mb-0.5 flex items-center gap-1">👤 ${userLabel}:</p>
                         <p class="text-gray-900 font-medium">${report.user?.firstName || ''} ${report.user?.lastName || ''}</p>
                         <p class="text-gray-500 text-[10px] truncate">${report.user?.email || ''}</p>
                    </div>
                `}
                
                <div class="flex items-center justify-between gap-1 text-xs mb-2">
                    <span class="font-semibold text-gray-600">${severityLabel}:</span>
                    <span class="px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide border ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' : 
                        report.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                        report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                    }">
                        ${severityValue}
                    </span>
                </div>

                ${report.status === ReportStatus.IN_PROGRESS && report.rescuer ? `
                     <div class="mt-3 pt-2 border-t border-gray-100 text-xs">
                        <p class="font-semibold text-orange-600 flex items-center gap-1">
                          <span class="animate-pulse">●</span> ${processingText}
                        </p>
                     </div>
                ` : ''}

                ${report.notes ? `
                    <div class="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 italic relative pl-2 border-l-2 border-gray-300">
                        "${report.notes.length > 60 ? report.notes.substring(0, 60) + '...' : report.notes}"
                    </div>
                ` : ''}
                
                ${report.status === ReportStatus.PENDING ? `
                    <button 
                        onclick="window.dispatchReport('${report._id}')"
                        class="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-md transition-colors shadow-sm active:scale-95 transform duration-100"
                    >
                        ${dispatchText}
                    </button>
                ` : ''}
                
                <div class="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                    <a href="/dashboard/reports?id=${report._id}" class="text-xs font-medium text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors group">
                        ${viewDetailsText} <span class="group-hover:translate-x-0.5 transition-transform">→</span>
                    </a>
                </div>
            </div>
          `;
      } else if (item.type === 'volunteer') {
          const user = item.data as MapUser;
          const userId = (user as any)._id || (user as any).id;
          itemId = userId;
          const isBusy = userId ? busyVolunteerIds.has(userId) : false;
          
          color = isBusy ? '#dc2626' : '#22c55e';
          const statusText = isBusy ? 'ON DUTY' : 'IDLE';
          const statusColor = isBusy ? 'text-red-600' : 'text-green-600';

          el.innerHTML = 'V';
          popupContent = `
             <div class="p-2">
                <h3 class="font-bold text-sm">${user.firstName || ''} ${user.lastName || ''}</h3>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-xs font-bold ${statusColor}">${statusText}</p>
                    <span class="text-[10px] text-gray-400">Volunteer</span>
                </div>
                ${isBusy ? `<p class="text-[10px] text-gray-500 italic mt-0.5">Assigned to a report</p>` : ''}
                <div class="text-xs mt-1 text-gray-500">
                    Active: ${user.lastLocationAt ? formatDistanceToNow(new Date(user.lastLocationAt)) + ' ago' : 'Unknown'}
                </div>
                <div class="mt-2">
                    <a href="tel:${user.mobileNumber}" class="text-blue-500 text-xs hover:underline">${user.mobileNumber || 'N/A'}</a>
                </div>
            </div>
          `;
      } else {
          color = '#06b6d4';
          const user = item.data as MapUser;
          const userId = (user as any)._id || (user as any).id;
          itemId = userId;

          el.innerHTML = 'U';
          popupContent = `
             <div class="p-2">
                <h3 class="font-bold text-sm">${user.firstName || ''} ${user.lastName || ''}</h3>
                <p class="text-xs text-cyan-600 font-medium">User</p>
                 <div class="text-xs mt-1 text-gray-500">
                    Active: ${user.lastLocationAt ? formatDistanceToNow(new Date(user.lastLocationAt)) + ' ago' : 'Unknown'}
                </div>
            </div>
          `;
      }
      
      el.style.backgroundColor = color;
      
      // Highlight selected
      if (selectedEntity?.id === itemId) {
          el.style.borderColor = '#ffffff';
          el.style.borderWidth = '3px';
          el.style.boxShadow = '0 0 15px currentColor';
          // Scale is handled by class, but if we need persistent scale:
          el.style.transform = 'scale(1.2)';
          el.style.zIndex = '10';
      }

      // Add Click Listener to set selected entity
      // Attach to container to ensure reliable click 
      containerRel.addEventListener('click', (e) => {
          e.stopPropagation(); // prevent map click
          setSelectedEntity({ id: itemId, type: item.type as any });
      });

      const popup = new vietmapgl.Popup({ offset: 25 }).setHTML(popupContent);
      
      // Clear selection on popup close
      popup.on('close', () => {
          // Optional: logic as before
      });

      // Pass the CONTAINER to the marker, not the visual element
      const marker = new vietmapgl.Marker(containerRel)
        .setLngLat(item.coords)
        .setPopup(popup)
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });

    // Optional: Fit bounds logic (skipped for brevity, can reuse previous logic if needed)


    // Draw Connection Line Logic
    if (mapRef.current) {
        const map = mapRef.current;
        const lineSourceId = 'related-connection-line';
        const lineLayerId = 'related-connection-layer';

        // Find coords
        let startCoords: [number, number] | null = null;
        let endCoords: [number, number] | null = null;

        if (selectedEntity && displayData) {
            const selectedItem = displayData.find(i => {
                const id = (i.data as any)._id || (i.data as any).id;
                return id === selectedEntity.id;
            });
            if (selectedItem) startCoords = selectedItem.coords;

            // Find related item in displayData
            // Logic: if selected is report, find rescuer. If selected is volunteer, find report.
            let relatedId: string | null = null;
            if (selectedEntity.type === 'report') {
                const r = selectedItem?.data as Report;
                if (r?.status === ReportStatus.IN_PROGRESS) relatedId = typeof r.rescuer === 'string' ? r.rescuer : (r.rescuer as any)?._id;
            } else if (selectedEntity.type === 'volunteer') {
                 // The displayData logic already ensured the pair is present if connected
                 // We just need to find the IN_PROGRESS report assigned to this volunteer
                 const volId = selectedEntity.id;
                 const linkedReport = displayData.find(d => 
                    d.type === 'report' && 
                    (d.data as Report).status === ReportStatus.IN_PROGRESS && 
                    (typeof (d.data as Report).rescuer === 'string' ? (d.data as Report).rescuer === volId : ((d.data as Report).rescuer as any)?._id === volId)
                 );
                 if (linkedReport) relatedId = linkedReport.data._id;
            }
            
            if (relatedId) {
                const relatedItem = displayData.find(i => {
                     const id = (i.data as any)._id || (i.data as any).id;
                     return id === relatedId;
                });
                if (relatedItem) endCoords = relatedItem.coords;
            }
        }

        const geojson: any = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: startCoords && endCoords ? [startCoords, endCoords] : []
            }
        };

        if (map.getSource(lineSourceId)) {
            (map.getSource(lineSourceId) as any).setData(geojson);
        } else {
            // Wait for style load if needed, but usually map is loaded here
            if (map.isStyleLoaded()) {
                map.addSource(lineSourceId, { type: 'geojson', data: geojson });
                map.addLayer({
                    id: lineLayerId,
                    type: 'line',
                    source: lineSourceId,
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 
                        'line-color': '#3b82f6', // blue-500
                        'line-width': 4, 
                        'line-dasharray': [2, 2],
                        'line-opacity': 0.8 
                    }
                });
            }
        }
    }

  }, [displayData, selectedEntity, t]);

  // Update Shelter Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing shelter markers
    shelterMarkersRef.current.forEach(marker => marker.remove());
    shelterMarkersRef.current = [];

    if (!showShelters || !sheltersData) return;

    // Shelter type colors
    const shelterColors: Record<string, string> = {
      EVACUATION: '#3b82f6', // blue
      WAREHOUSE: '#22c55e',  // green
      MEDICAL: '#ef4444',    // red
      TEMPORARY: '#f59e0b',  // amber
      SCHOOL: '#8b5cf6',     // violet
      COMMUNITY_CENTER: '#ec4899', // pink
      GYM: '#14b8a6',        // teal
      PAGODA: '#a855f7',     // purple
      CHURCH: '#6366f1',     // indigo
      OFFICIAL: '#64748b',   // slate
      OTHER: '#71717a',      // zinc
    };

    sheltersData.forEach((shelter) => {

      if (!shelter.location?.coordinates?.length) return;

      const coords: [number, number] = shelter.location.coordinates as [number, number];
      const color = shelterColors[shelter.type] || '#6b7280';

      // Create shelter marker element
      const el = document.createElement('div');
      el.className = 'shelter-marker cursor-pointer';
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${color};
          border-radius: 8px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      `;

      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-bold px-2 py-0.5 rounded" style="background: ${color}20; color: ${color}">
              ${shelter.type}
            </span>
            <span class="text-xs ${shelter.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-500'}">${shelter.status}</span>
          </div>
          <h3 class="font-bold text-sm mb-1">${shelter.name}</h3>
          <p class="text-xs text-gray-600 mb-2">${shelter.address}</p>
          ${shelter.capacity ? `
            <div class="text-xs mb-2">
              <span class="font-medium">Capacity:</span> ${shelter.currentOccupancy || 0}/${shelter.capacity}
            </div>
          ` : ''}
          ${shelter.contactPerson ? `
            <div class="text-xs border-t pt-2 mt-2">
              <p class="font-medium">${shelter.contactPerson}</p>
              ${shelter.contactPhone ? `<a href="tel:${shelter.contactPhone}" class="text-blue-500">${shelter.contactPhone}</a>` : ''}
            </div>
          ` : ''}
          <div class="mt-2 pt-2 border-t">
            <a href="/dashboard/shelters" class="text-xs text-blue-500 hover:underline">View all shelters →</a>
          </div>
        </div>
      `;

      const popup = new vietmapgl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new vietmapgl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(mapRef.current!);

      shelterMarkersRef.current.push(marker);
    });
  }, [showShelters, sheltersData]);

  const isLoading = isLoadingReports || isLoadingUsers || isLoadingShelters;

  return (
    <div className="h-[calc(100vh-8rem)] w-full relative rounded-md overflow-hidden border">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 w-80">
        
        {/* Mode Switcher */}
        <div className="bg-background/95 backdrop-blur p-2 rounded-lg shadow-lg">
             <Tabs value={mapMode} onValueChange={(v) => setMapMode(v as MapMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-8">
                    <TabsTrigger value="all" className="px-1"><Activity className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="reports" className="px-1"><FileText className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="users" className="px-1"><Users className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="volunteers" className="px-1"><div className="flex items-center justify-center font-bold text-[10px] w-4 h-4 rounded-full border border-current">V</div></TabsTrigger>
                </TabsList>
            </Tabs>
            {/* Shelter Toggle */}
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <Button 
                    variant={showShelters ? "default" : "outline"} 
                    size="sm" 
                    className="h-7 text-xs flex-1"
                    onClick={() => setShowShelters(!showShelters)}
                >
                    <Home className="h-3 w-3 mr-1" />
                    Shelters {showShelters ? 'ON' : 'OFF'}
                </Button>
            </div>
        </div>

        {/* Detailed Controls (Search/Filter) - Only show for Reports mode or All */}
        {(mapMode === "reports" || mapMode === "all") && (
            <div className="bg-background/95 backdrop-blur p-4 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{t("MAP.TITLE")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-6 w-6 p-0">
                        <ListFilter className="h-4 w-4" />
                    </Button>
                </div>
                 <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="pl-9 h-8 text-sm"
                    />
                </div>
                
                {showFilters && (
                    <div className="space-y-2 pt-2 border-t">
                         <select
                            value={reportTypeFilter}
                            onChange={(e) => setReportTypeFilter(e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded bg-background"
                        >
                            <option value="all">All Types</option>
                            {Object.values(ReportType).map((t) => (
                            <option key={t} value={t}>{t.toUpperCase()}</option>
                            ))}
                        </select>
                         <select
                            value={reportStatusFilter}
                            onChange={(e) => setReportStatusFilter(e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded bg-background"
                        >
                            <option value="all">All Status</option>
                            {Object.values(ReportStatus).map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        )}
      </div>

       {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 text-xs">
          {showLegend && (
               <div className="bg-background/95 backdrop-blur p-3 rounded-lg shadow-lg w-32 space-y-1.5 animate-in slide-in-from-bottom-2">
                    <div className="font-semibold mb-1 flex justify-between items-center">
                        {t("MAP.LEGEND")}
                         <span onClick={() => setShowLegend(false)} className="cursor-pointer">×</span>
                    </div>
                    {/* User Legend */}
                    {(mapMode === "users" || mapMode === "all" || mapMode === "volunteers") && (
                        <>
                             {(mapMode !== "users") && (
                                 <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-green-500 text-[8px] text-white flex items-center justify-center font-bold">V</div>
                                        <span>{t("MAP.LEGEND_VOL_IDLE")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-red-600 text-[8px] text-white flex items-center justify-center font-bold">V</div>
                                        <span>{t("MAP.LEGEND_VOL_BUSY")}</span>
                                    </div>
                                 </>
                             )}
                             {(mapMode !== "volunteers") && (
                                 <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-cyan-500 text-[8px] text-white flex items-center justify-center font-bold">U</div>
                                    <span>{t("MAP.LEGEND_USER")}</span>
                                </div>
                             )}
                             <hr className="my-1 border-muted" />
                        </>
                    )}

                    {(mapMode === "reports" || mapMode === "all") && (
                        <>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> {t("MAP.LEGEND_REPORT_PENDING")}</div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> {t("MAP.LEGEND_REPORT_PROCESSING")}</div>
                        </>
                    )}
                    
                    {/* Shelter Legend */}
                    {showShelters && (
                        <>
                            <hr className="my-1 border-muted" />
                            <div className="text-[10px] font-medium text-muted-foreground mb-1">{t("MAP.LEGEND_SHELTER")}</div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-blue-500" />
                                <span className="text-[10px]">{t("MAP.LEGEND_SHELTER_TYPES.EVACUATION")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500" />
                                <span className="text-[10px]">{t("MAP.LEGEND_SHELTER_TYPES.WAREHOUSE")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-red-500" />
                                <span className="text-[10px]">{t("MAP.LEGEND_SHELTER_TYPES.MEDICAL")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-amber-500" />
                                <span className="text-[10px]">{t("MAP.LEGEND_SHELTER_TYPES.TEMPORARY")}</span>
                            </div>
                        </>
                    )}
                    
                    {/* Always show Me marker legend */}
                    <hr className="my-1 border-muted" />
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow flex items-center justify-center">
                           <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                        <span>{t("MAP.LEGEND_ME")}</span>
                    </div>
               </div>
          )}
          {!showLegend && (
               <Button variant="secondary" size="sm" onClick={() => setShowLegend(true)}>{t("MAP.LEGEND")}</Button>
          )}
      </div>
      
      {assignReportId && (
        <AssignVolunteerDialog 
            reportId={assignReportId} 
            onClose={() => setAssignReportId(null)} 
        />
      )}
    </div>
  );
}

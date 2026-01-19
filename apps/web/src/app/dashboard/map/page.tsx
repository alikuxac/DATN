"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Report, ApiResponse, ReportStatus, ReportType, UserListResponse, UserRole } from "@/types";
import { Loader2, Search, ListFilter, Users, FileText, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

// Placeholder for Vietmap API Key
const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "YOUR_VIETMAP_API_KEY";

type MapMode = "reports" | "users" | "volunteers" | "all";

// Extend User type locally if needed (assuming shared type might miss location)
// Extend User type locally if needed (assuming shared type might miss location)
interface MapUser extends Omit<UserListResponse, 'lastLocationAt'> {
    location?: { type: string; coordinates: number[] };
    lastLocationAt?: string | Date;
}

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [mapMode, setMapMode] = useState<MapMode>("reports");
  
  // Report Filters
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("all");
  
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
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

  // Filter Data for Display
  const displayData = useMemo(() => {
    const items: { type: 'report' | 'user' | 'volunteer'; data: any, coords: [number, number] }[] = [];

    // Process Reports
    if ((mapMode === "reports" || mapMode === "all") && reportsData) {
      reportsData.forEach(r => {
        if (r.location?.coordinates?.length === 2) {
          items.push({ type: 'report', data: r, coords: r.location.coordinates as [number, number] });
        }
      });
    }

    // Process Users
    if (usersData) {
       usersData.forEach(u => {
          if (u.location?.coordinates?.length === 2) {
              const role = u.role === UserRole.VOLUNTEER ? 'volunteer' : 'user';
              if (mapMode === "all" || (mapMode === "users" && role === "user") || (mapMode === "volunteers" && role === "volunteer")) {
                  items.push({ type: role as 'user' | 'volunteer', data: u, coords: u.location.coordinates as [number, number] });
              }
          }
       });
    }

    return items;
  }, [mapMode, reportsData, usersData]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

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
      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center text-[10px] font-bold text-white';
      
      let color = '#6b7280';
      let popupContent = '';

      if (item.type === 'report') {
          const report = item.data as Report;
          const isGuest = (report as any).source === 'GUEST';
          
          // Color Logic
          if (isGuest) {
             color = '#9333ea'; // Purple for Guest
          } else {
             if (report.status === ReportStatus.PENDING) color = '#ef4444'; // Red
             else if (report.status === ReportStatus.RESOLVED) color = '#10b981'; // Green
             else if (report.status === ReportStatus.IN_PROGRESS) color = '#f59e0b'; // Orange
             else if (report.status === ReportStatus.VERIFIED) color = '#3b82f6'; // Blue
          }

          // Guest Details parsing
          let guestPhone = 'N/A';
          if (isGuest && report.notes) {
              const match = report.notes.match(/Guest Phone: ([\d+]+)/);
              if (match) guestPhone = match[1];
          }

          // Popup Content
          popupContent = `
            <div class="p-3 w-48">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isGuest ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} uppercase">
                        ${isGuest ? 'GUEST' : 'APP'}
                    </span>
                    <span class="text-[10px] font-medium text-gray-500 capitalize">${report.status.replace("_", " ")}</span>
                </div>
                
                <h3 class="font-bold text-sm mb-1">${report.type.toUpperCase()}</h3>
                
                ${isGuest ? `
                    <div class="mb-2 p-2 bg-gray-50 rounded text-xs border border-dashed border-gray-300">
                        <p class="font-semibold text-gray-700">📞 Phone:</p>
                        <a href="tel:${guestPhone}" class="text-blue-600 hover:underline block mb-1">${guestPhone}</a>
                    </div>
                ` : `
                    <div class="mb-2 p-2 bg-gray-50 rounded text-xs">
                        <p class="font-semibold text-gray-700">👤 User:</p>
                         <p class="text-gray-600">${report.user?.firstName || 'Unknown'} ${report.user?.lastName || ''}</p>
                         <p class="text-gray-500 text-[10px]">${report.user?.email || ''}</p>
                    </div>
                `}

                <div class="flex items-center gap-1 text-xs mb-1">
                    <span class="font-semibold">Severity:</span>
                    <span class="${report.severity === 'critical' ? 'text-red-600 font-bold' : report.severity === 'high' ? 'text-orange-600 font-bold' : 'text-gray-600'} capitalize">
                        ${report.severity || 'low'}
                    </span>
                </div>

                ${report.notes ? `
                    <div class="mt-2 pt-2 border-t text-xs text-gray-500 italic">
                        "${report.notes.length > 50 ? report.notes.substring(0, 50) + '...' : report.notes}"
                    </div>
                ` : ''}
                
                <div class="mt-2 pt-2 border-t flex justify-end">
                    <a href="/dashboard/reports?id=${report._id}" class="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                        View Details →
                    </a>
                </div>
            </div>
          `;
      } else if (item.type === 'volunteer') {
          // ... (keep existing volunteer logic)
          const user = item.data as MapUser;
          // Support both _id and id
          const userId = (user as any)._id || (user as any).id;
          const isBusy = userId ? busyVolunteerIds.has(userId) : false;
          
          color = isBusy ? '#f97316' : '#8b5cf6'; // Orange (Busy) vs Purple (Idle)
          const statusText = isBusy ? 'ON DUTY' : 'IDLE';
          const statusColor = isBusy ? 'text-orange-600' : 'text-purple-600';

          el.innerHTML = 'V';
          popupContent = `
             <div class="p-2">
                <h3 class="font-bold text-sm">${user.firstName} ${user.lastName}</h3>
                <div class="flex items-center gap-2 mt-1">
                    <p class="text-xs font-bold ${statusColor}">${statusText}</p>
                    <span class="text-[10px] text-gray-400">Volunteer</span>
                </div>
                <div class="text-xs mt-1 text-gray-500">
                    Active: ${user.lastLocationAt ? formatDistanceToNow(new Date(user.lastLocationAt)) + ' ago' : 'Unknown'}
                </div>
                <div class="mt-2">
                    <a href="tel:${user.mobileNumber}" class="text-blue-500 text-xs hover:underline">${user.mobileNumber}</a>
                </div>
            </div>
          `;
      } else {
           // ... (keep existing user logic)
          color = '#06b6d4'; // Cyan
          const user = item.data as MapUser;
          el.innerHTML = 'U';
          popupContent = `
             <div class="p-2">
                <h3 class="font-bold text-sm">${user.firstName} ${user.lastName}</h3>
                <p class="text-xs text-cyan-600 font-medium">User</p>
                 <div class="text-xs mt-1 text-gray-500">
                    Active: ${user.lastLocationAt ? formatDistanceToNow(new Date(user.lastLocationAt)) + ' ago' : 'Unknown'}
                </div>
            </div>
          `;
      }
      
      el.style.backgroundColor = color;

      const marker = new vietmapgl.Marker(el)
        .setLngLat(item.coords)
        .setPopup(new vietmapgl.Popup({ offset: 25 }).setHTML(popupContent))
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });

    // Optional: Fit bounds logic (skipped for brevity, can reuse previous logic if needed)

  }, [displayData]);

  const isLoading = isLoadingReports || isLoadingUsers;

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
                    <TabsTrigger value="all" className="text-xs px-1">All</TabsTrigger>
                    <TabsTrigger value="reports" className="text-xs px-1">Rpts</TabsTrigger>
                    <TabsTrigger value="users" className="text-xs px-1">Usrs</TabsTrigger>
                    <TabsTrigger value="volunteers" className="text-xs px-1">Vols</TabsTrigger>
                </TabsList>
            </Tabs>
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
                        Legend
                         <span onClick={() => setShowLegend(false)} className="cursor-pointer">×</span>
                    </div>
                    {/* User Legend */}
                    {(mapMode === "users" || mapMode === "all" || mapMode === "volunteers") && (
                        <>
                             {(mapMode !== "users") && (
                                 <>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-purple-500 text-[8px] text-white flex items-center justify-center font-bold">V</div>
                                        <span>Vol (Idle)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-orange-500 text-[8px] text-white flex items-center justify-center font-bold">V</div>
                                        <span>Vol (Busy)</span>
                                    </div>
                                 </>
                             )}
                             {(mapMode !== "volunteers") && (
                                 <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-cyan-500 text-[8px] text-white flex items-center justify-center font-bold">U</div>
                                    <span>User</span>
                                </div>
                             )}
                             <hr className="my-1 border-muted" />
                        </>
                    )}

                    {(mapMode === "reports" || mapMode === "all") && (
                        <>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Pending</div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Verified</div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> In Progress</div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Resolved</div>
                        </>
                    )}
               </div>
          )}
          {!showLegend && (
               <Button variant="secondary" size="sm" onClick={() => setShowLegend(true)}>Legend</Button>
          )}
      </div>
    </div>
  );
}

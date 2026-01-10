"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Report, ApiResponse, ReportStatus, ReportSeverity, ReportType } from "@/types";
import { Loader2, Search, ListFilter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useLanguage } from "@/contexts/LanguageContext";

// Placeholder for Vietmap API Key
const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY || "YOUR_VIETMAP_API_KEY";

// Map Component
export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const markersRef = useRef<vietmapgl.Marker[]>([]);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const { t } = useLanguage();

  // Fetch Reports with filters
  const { data: reportsData, isLoading, refetch } = useQuery({
    queryKey: ['map-reports', debouncedSearch, typeFilter, statusFilter],
    queryFn: async () => {
      const params: any = {
        limit: 100,
        page: 1,
      };

      if (debouncedSearch) params.q = debouncedSearch;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      console.log('Fetching reports with params:', params);

      const { data } = await api.get<ApiResponse<Report[]>>('/admin/report/list', { params });
      return data.data || [];
    },
    retry: 1,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;


    const map = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: "https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=" + VIETMAP_API_KEY,
      center: [105.854444, 21.028511], // Hanoi default
      zoom: 12,
    });
    
    // Debugging logs
    map.on('load', () => console.log('✅ Map loaded successfully'));
    map.on('styledata', () => console.log('🎨 Map style data loaded'));
    console.log('🔑 Initializing map with key prefix:', VIETMAP_API_KEY?.substring(0, 8) + '...');

    map.addControl(new vietmapgl.NavigationControl(), "top-right");
    map.addControl(new vietmapgl.FullscreenControl(), "top-right");

    // Create Geolocate Control
    const geolocateControl = new vietmapgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserLocation: true
    });
    map.addControl(geolocateControl, "bottom-right");

    // Handle Geolocate Events

    geolocateControl.on('geolocate', (e) => {
        console.log('📍 User location locked:', e.coords);
    });
    geolocateControl.on('error', (e) => {
        console.warn('⚠️ Geolocation blocked/failed:', e);
        // Map stays at default center, no UI breakage
    });

    mapRef.current = map;
    
    // Force resize to ensure canvas matches container
    map.on('load', () => {
        map.resize();
        console.log('✅ Map loaded and resized. Center:', map.getCenter());
        
        // Auto trigger location after map loads (non-blocking)
        console.log('📍 Triggering auto-locate...');
        setTimeout(() => {
            geolocateControl.trigger(); 
        }, 1000); 
    });

    return () => {
      mapRef.current = null;

      // Handle async errors selectively
      const handleRejection = (event: PromiseRejectionEvent) => {
        const isAbort = event.reason?.name === 'AbortError' || 
                        event.reason?.message === 'signal is aborted without reason' ||
                        event.reason?.message === 'Aborted';
        if (isAbort) {
            event.preventDefault();
        }
      };
      
      window.addEventListener('unhandledrejection', handleRejection);
      
      map.on('error', (e) => {
        const error = e.error || e;
        const isAbort = error?.message === 'signal is aborted without reason' || error?.name === 'AbortError';
        if (!isAbort) {
          console.error('❌ Map Instance Error:', error);
        }
      });

      try {
        map.remove();
      } catch (error) {
        // ignore sync removal errors
      }
      
      setTimeout(() => window.removeEventListener('unhandledrejection', handleRejection), 100);
    };
  }, []);

  // Update Markers when reports data changes
  useEffect(() => {
    if (!mapRef.current || !reportsData) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    console.log('Adding markers for reports:', reportsData.length);

    reportsData.forEach((report) => {
      // Check if coordinates exist
      if (!report.location?.coordinates || report.location.coordinates.length !== 2) {
        console.warn('Invalid coordinates for report:', report._id);
        return;
      }

      const [lng, lat] = report.location.coordinates;

      const el = document.createElement('div');
      el.className = 'w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer';
      
      // Color code by status
      if (report.status === ReportStatus.PENDING) el.style.backgroundColor = '#ef4444';
      else if (report.status === ReportStatus.RESOLVED) el.style.backgroundColor = '#10b981';
      else if (report.status === ReportStatus.IN_PROGRESS) el.style.backgroundColor = '#f59e0b';
      else if (report.status === ReportStatus.VERIFIED) el.style.backgroundColor = '#3b82f6';
      else el.style.backgroundColor = '#6b7280';

      const marker = new vietmapgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new vietmapgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm">${report.type.toUpperCase()}</h3>
            <p class="text-xs text-gray-500">${report.status}</p>
            <p class="text-xs mt-1">Severity: ${report.severity}</p>
            <p class="text-xs">People: ${report.peopleCount || 0}</p>
            ${report.notes ? `<p class="text-xs mt-1">${report.notes.substring(0, 50)}...</p>` : ''}
          </div>
        `))
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if we have reports with valid coordinates
    if (reportsData.length > 0 && mapRef.current) {
      const bounds = new vietmapgl.LngLatBounds();
      let hasValidCoordinates = false;
      
      reportsData.forEach(report => {
        if (report.coordinates && report.coordinates.length === 2) {
          const [lng, lat] = report.coordinates;
          // Validate that coordinates are numbers
          if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
            bounds.extend([lng, lat]);
            hasValidCoordinates = true;
          }
        }
      });
      
      // Only fit bounds if we have at least one valid coordinate
      if (hasValidCoordinates) {
        mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [reportsData]);

  return (
    <div className="h-[calc(100vh-8rem)] w-full relative rounded-md overflow-hidden border">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Search & Filter Panel */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur p-4 rounded-lg shadow-lg w-80 z-20">
        <h3 className="font-semibold mb-3 text-lg">{t("MAP.TITLE")}</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("MAP.SEARCH_PLACEHOLDER")}
            className="pl-9"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant={typeFilter !== "all" || statusFilter !== "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full mb-2"
        >
          <ListFilter className="h-4 w-4 mr-2" />
          {t("MAP.FILTERS")} {(typeFilter !== "all" || statusFilter !== "all") && "•"}
        </Button>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 mt-3 pt-3 border-t">
            {/* Type Filter */}
            <div>
              <label className="text-xs font-medium mb-1 block">{t("MAP.LABEL_TYPE")}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="all">All</option>
                {Object.values(ReportType).map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-xs font-medium mb-1 block">{t("MAP.LABEL_STATUS")}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="all">All</option>
                {Object.values(ReportStatus).map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypeFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="w-full"
            >
              {t("MAP.RESET_FILTERS")}
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            {t("MAP.SHOWING_REPORTS", { count: String(reportsData?.length || 0) })}
          </p>
        </div>
      </div>

      {/* Legend Toggle & Content */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2">
        {showLegend && (
          <div className="bg-background/95 backdrop-blur p-3 rounded-lg shadow-lg w-40 animate-in slide-in-from-bottom-2 fade-in">
            <div className="flex items-center justify-between mb-2">
               <h4 className="text-xs font-semibold">{t("MAP.LEGEND_TITLE")}</h4>
               <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setShowLegend(false)}>
                  <span className="sr-only">{t("MAP.CLOSE")}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-3 w-3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>{t("REPORTS.STATUS.PENDING")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>{t("REPORTS.STATUS.VERIFIED")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>{t("REPORTS.STATUS.IN_PROGRESS")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>{t("REPORTS.STATUS.RESOLVED")}</span>
              </div>
            </div>
          </div>
        )}
        
        {!showLegend && (
           <Button 
            variant="secondary" 
            size="sm" 
            className="shadow-lg"
            onClick={() => setShowLegend(true)}
           >
             <ListFilter className="h-4 w-4 mr-2" />
             {t("MAP.SHOW_LEGEND")}
           </Button>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";
import { apiService } from "@/services/api.service";
import { useDebounce } from "@/hooks/useDebounce";

// Components
import { AppInput, AppText, Chip, Icon } from "@/components/ui";
import {
  ENUM_REPORT_SEVERITY,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_TYPE,
  ENUM_REPORT_SOURCE
} from "@repo/shared";
import { useLocationContext } from "@/context/LocationContext";
import { calculateDistance } from "@/utils/geo";


import { ReportCard } from "@/components/reports/ReportCard";
import { ReportFilterModal } from "@/components/reports/ReportFilterModal";
import { ReportEditModal } from "@/components/reports/ReportEditModal";

// --- INTERFACES ---
export interface IReport {
  _id: string;
  user: string;
  by: string;
  authorName?: string;
  type: ENUM_REPORT_TYPE;
  coordinates: [number, number]; // [Longitude, Latitude] - GeoJSON format
  // address: string; // --> ĐÃ BỎ ADDRESS
  description?: string;
  severity: ENUM_REPORT_SEVERITY;
  status: ENUM_REPORT_STATUS;
  peopleCount: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  rescuers?: any[];
}

// --- CONSTANTS ---
const TYPE_FILTERS = [
  { label: "All", value: "all" },
  ...Object.values(ENUM_REPORT_TYPE).map((t) => ({
    label: t.toUpperCase(),
    value: t,
  })),
];

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  ...Object.values(ENUM_REPORT_STATUS).map((s) => ({
    label: s.replace("_", " ").toUpperCase(),
    value: s,
  })),
];

const SOURCE_FILTERS = [
  { label: "All", value: "all" },
  { label: "App (User)", value: ENUM_REPORT_SOURCE.APP },
  { label: "Guest (SOS)", value: ENUM_REPORT_SOURCE.GUEST },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, token, theme } = useAppSelector((state) => state.app);
  const { currentRegion, userLocation } = useLocationContext();
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  // --- STATE ---
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Applied Filters
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<string>("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>("all");
  const [appliedSourceFilter, setAppliedSourceFilter] = useState<string>("all");

  // Temp Filters
  const [tempTypeFilter, setTempTypeFilter] = useState<string>("all");
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");
  const [tempSourceFilter, setTempSourceFilter] = useState<string>("all");

  // Edit / Action State
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API HANDLERS ---

  const fetchReports = useCallback(async (pageNum = 1) => {
    // If page 1, show full loading (unless refreshing). If > 1, show footer loader only (handled by list).
    // Here we use single isLoading for simplicity or add isMoreLoading separately.
    // For specific UI, let's keep isLoading for global spinner on first load only?
    if (pageNum === 1 && !isRefreshing) setIsLoading(true);

    try {
      const params: any = {
        limit: 10,
        page: pageNum,
        regionId: currentRegion,
        sort: '-createdAt' // Sort by Latest
      };

      if (debouncedSearch) params.q = debouncedSearch;
      if (appliedTypeFilter !== "all") params.type = appliedTypeFilter;
      if (appliedStatusFilter !== "all") params.status = appliedStatusFilter;
      if (appliedSourceFilter !== "all") params.source = appliedSourceFilter;

      const queryString = new URLSearchParams(params).toString();

      const response = await apiService.get<{ data: any[] }>(
        `/user/report?${queryString}`
      );

      const reports = response.data || [];
      
      // Update HasMore logic: If returned count < limit, no more data from server.
      if (reports.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // CLIENT-SIDE FILTER: Hide reports irrelevant to current user
      // Rule: Show only if (Mine) OR (My Rescue Task) OR (Pending & Unassigned)
      const filteredReports = reports.filter((item: any) => {
          const currentUserId = user?._id?.toString();
          if (!currentUserId) return false;

          // 1. Created by me
          const authorId = (typeof item.user === 'object' ? item.user?._id : item.user)?.toString();
          const creatorId = (typeof item.by === 'object' ? item.by?._id : item.by)?.toString();
          
          if (authorId === currentUserId || creatorId === currentUserId) return true;

          // 2. Rescued by me
          if (item.rescuers && Array.isArray(item.rescuers)) {
              const isMyRescue = item.rescuers.some((r: any) => {
                  const rId = (typeof r === 'object' ? r._id : r)?.toString();
                  return rId === currentUserId;
              });
              if (isMyRescue) return true;
          }

          // 3. Pending & Unassigned (Available for volunteers)
          // OR In Progress (Available for MORE volunteers) - Requirement: "1 report can be received by multiple volunteers"
          // So we show it if status is PENDING or IN_PROGRESS (unless I'm already in it, handled above)
          // But typically we show PENDING to everyone. IN_PROGRESS might be shown if we allow joining?
          // If the report status is PENDING, anyone can join.
          // If IN_PROGRESS, others can still join? Yes, per "1 report can be received by multiple volunteers".
          
          if (item.status === ENUM_REPORT_STATUS.PENDING) return true;
          
          // Show IN_PROGRESS reports that I haven't joined yet?
          if (item.status === ENUM_REPORT_STATUS.IN_PROGRESS) {
             const amIGuiding = item.rescuers?.some((r: any) => ((typeof r === 'object' ? r._id : r)?.toString() === currentUserId));
             if (!amIGuiding) return true; 
          }

          return false;
      });

      // Process & Sort Reports
      const processedReports = filteredReports.sort((a: any, b: any) => {
          const currentUserId = user?._id?.toString();
          
          // Helper to check if "My Active Mission"
          const isMyActiveA = a.status === ENUM_REPORT_STATUS.IN_PROGRESS && (
              // Use safe optional chaining and type checks
              (a.rescuers && Array.isArray(a.rescuers) && a.rescuers.some((r: any) => (typeof r === 'object' ? r._id : r)?.toString() === currentUserId)) ||
              ((typeof a.user === 'object' ? a.user?._id : a.user)?.toString() === currentUserId)
          );
          
          const isMyActiveB = b.status === ENUM_REPORT_STATUS.IN_PROGRESS && (
               (b.rescuers && Array.isArray(b.rescuers) && b.rescuers.some((r: any) => (typeof r === 'object' ? r._id : r)?.toString() === currentUserId)) ||
               ((typeof b.user === 'object' ? b.user?._id : b.user)?.toString() === currentUserId)
          );

          if (isMyActiveA && !isMyActiveB) return -1; // A comes first
          if (!isMyActiveA && isMyActiveB) return 1;  // B comes first
          
          // Default sort by CreatedAt Desc
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }).filter(r => {
          // Distance Filter: Only show reports within 50km
          if (!userLocation) return true; // If no location, show all (fallback)
          
          const rLat = r.coordinates?.[1] ?? (r as any).location?.coordinates?.[1];
          const rLng = r.coordinates?.[0] ?? (r as any).location?.coordinates?.[0];

          if (!rLat || !rLng) return false;

          const dist = calculateDistance(userLocation.latitude, userLocation.longitude, rLat, rLng);
          return dist <= 50000; // 50km
      });

      if (pageNum === 1) {
        setData(processedReports);
      } else {
        setData(prev => {
          const combined = [...prev, ...processedReports];
          // Re-sort entire list to ensure priority is kept even with pagination (though less likely to shift drastically)
          // Actually, pagination fetch might break "pinned top" if page 2 has my report (unlikely with sorting by date on backend?).
          // But here we do client side pinning.
          const unique = Array.from(new Map(combined.map(r => [r._id, r])).values());
          
          return unique.sort((a: any, b: any) => {
              const currentUserId = user?._id?.toString();
              const isMyActiveA = a.status === ENUM_REPORT_STATUS.IN_PROGRESS && (
                  (a.rescuers?.some((r: any) => (typeof r === 'object' ? r._id : r)?.toString() === currentUserId)) ||
                  ((typeof a.user === 'object' ? a.user?._id : a.user)?.toString() === currentUserId)
              );
              const isMyActiveB = b.status === ENUM_REPORT_STATUS.IN_PROGRESS && (
                   (b.rescuers?.some((r: any) => (typeof r === 'object' ? r._id : r)?.toString() === currentUserId)) ||
                   ((typeof b.user === 'object' ? b.user?._id : b.user)?.toString() === currentUserId)
              );
              if (isMyActiveA && !isMyActiveB) return -1;
              if (!isMyActiveA && isMyActiveB) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
      }
      
      // Update current page ref if needed, or rely on state passed in
      setPage(pageNum);

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, appliedTypeFilter, appliedStatusFilter, appliedSourceFilter, isRefreshing, currentRegion, user, userLocation]);

  // Initial Load & Filter Change
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
      // Reset to page 1 when filters change
      fetchReports(1); 
    });
    return () => task.cancel();
  }, [debouncedSearch, appliedTypeFilter, appliedStatusFilter, appliedSourceFilter]); // Removed fetchReports from dep to avoid loop if not careful, added strict deps

  // --- SOCKET LISTENERS ---
  const { socket } = useLocationContext();

  useEffect(() => {
      if (!socket || !currentRegion) return;

      // Join Region Room to hear about new reports in this area
      socket.emit('join_region', { regionId: currentRegion });

      const handleNewReport = (payload: { report: any }) => {
           console.log("New report received via socket (List):", payload.report._id);
           setData(prev => {
               if (prev.find(r => r._id === payload.report._id)) return prev;
               
               // Check if new report matches current filters before adding
               // Simple client-side check for Type/Source/Status if needed, 
               // but predominantly we want to show it if it's relevant to the region.
               // We can re-use the 'filteredReports' logic or just prepend.
               // For now, prepend and let user filter if they really want strict adherence, 
               // OR ideally, check against applied filters.
               
               const r = payload.report;
               if (appliedTypeFilter !== 'all' && r.type !== appliedTypeFilter) return prev;
               if (appliedStatusFilter !== 'all' && r.status !== appliedStatusFilter) return prev;
               if (appliedSourceFilter !== 'all' && r.source !== appliedSourceFilter) return prev;

               return [r, ...prev];
           });
      };
      
      const handleReportUpdate = (payload: { reportId: string, status: ENUM_REPORT_STATUS, rescuerId?: string }) => {
           setData(prev => prev.map(r => {
               if (r._id === payload.reportId) {
                   // Ensure rescuers is array
                   let currentRescuers = r.rescuers || [];
                   if (payload.rescuerId) {
                       // Add if not exists
                       const exists = currentRescuers.some((ex: any) => {
                           const exId = typeof ex === 'object' ? ex._id : ex;
                           return exId === payload.rescuerId;
                       });
                       if (!exists) {
                           // Ideally we need full rescuer object, but for ID check string is ok or partial object
                           // For UI display might be issue if we only have ID. 
                           // But usually fetchReports refresh eventually.
                           // Helper: just push ID if string, or create partial
                           currentRescuers = [...currentRescuers, payload.rescuerId];
                       }
                   }
                   
                   return { 
                      ...r, 
                      status: payload.status,
                      rescuers: currentRescuers
                   };
               }
               return r;
           }));
      };

      const handleReportCancelled = (payload: { reportId: string, status: string }) => {
            console.log("Report cancelled via socket (List):", payload.reportId);
            setData(prev => prev.map(r => {
                if (r._id === payload.reportId) {
                    // Logic: If cancelled, it means *someone* cancelled.
                    // If the payload has `rescuerId`, it means THAT rescuer left.
                    // If status becomes PENDING, it means everyone left.
                    
                    // We need to look at payload structure. Service emits: { reportId, regionId, report, rescuerId }
                    // But here payload type is generic. Let's assume we receive updated report or we handle logic.
                    // The service emits: this.eventEmitter.emit('report.cancelled', { ... });
                    // Socket Gateway forwards it.
                    
                    // Simplified: just update status and let UI refresh or simple toggle if PENDING.
                    
                    const isPending = payload.status === ENUM_REPORT_STATUS.PENDING;
                    
                    return { 
                       ...r, 
                       status: payload.status, // use status from payload
                       rescuers: isPending ? [] : r.rescuers // Clear if pending
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
           socket.off('report_accepted', handleReportUpdate);
           socket.off('report_assigned', handleReportUpdate);
           socket.off('report_completed', handleReportUpdate);
           socket.off('report_rejected', handleReportUpdate);
           socket.off('report_cancelled', handleReportCancelled);
      };
  }, [socket, currentRegion, appliedTypeFilter, appliedStatusFilter, appliedSourceFilter]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    fetchReports(1);
  };

  const handleLoadMore = () => {
    if (!isLoading && !isRefreshing && hasMore) {
        fetchReports(page + 1);
    }
  };



  // 1. UPDATE REPORT
  const handleEditSave = async () => {
    if (!editingReport) return;
    try {
      setIsSubmitting(true);
      // Bỏ field address trong payload
      await apiService.post(`/user/report/${editingReport._id}`, {
        notes: editingReport.notes,
        peopleCount: editingReport.peopleCount,
        severity: editingReport.severity,
      });

      Alert.alert(t("COMMON.SUCCESS"), "Report updated successfully");
      setEditingReport(null);
      fetchReports();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. DELETE REPORT
  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.delete(`/user/report/${id}`);
            setData((prev) => prev.filter((item) => item._id !== id));
          } catch (error) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  // 3. ACCEPT REPORT
  const handleAccept = async (id: string) => {
    try {
      setIsSubmitting(true);
      await apiService.post(`/user/report/${id}/accept`, {});
      Alert.alert("Success", "You have accepted this rescue mission!");
      fetchReports();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      if (message === 'report.error.alreadyAccepted' || message === 'report.error.notFound') {
         Alert.alert(t('COMMON.NOTICE'), t('REPORT.ERROR.ALREADY_TAKEN') || "This report has been taken by someone else.");
         fetchReports();
      } else if (message === 'report.error.alreadyHasActiveReport') {
         Alert.alert(t('COMMON.NOTICE'), t('REPORT.ERROR.ALREADY_ACTIVE') || "You already have an active mission.");
      } else {
        Alert.alert(
          "Error",
          message || "Cannot accept report"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. REJECT/CANCEL REPORT
  const handleReject = async (id: string, data?: any) => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to reject/cancel this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiService.post(`/user/report/${id}/reject`, {
                  reason: data?.reason || undefined
              });
              fetchReports();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Cannot reject"
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // 5. RESOLVE REPORT (Mission Complete)
  const handleResolve = async (id: string) => {
     Alert.alert(
      "Confirm",
      "Have you completed this rescue mission?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Completed",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiService.post(`/report/${id}/complete`, {});
              Alert.alert("Success", "Great job! Mission completed.");
              fetchReports();
            } catch (error: any) {
               Alert.alert("Error", error?.response?.data?.message || "Cannot complete");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // 6. CANCEL REPORT (Volunteer cancels accepted mission)
  const handleCancel = async (id: string) => {
     Alert.alert(
      t('COMMON.CONFIRM') || "Confirm",
      t('REPORT.CONFIRM.CANCEL') || "Are you sure you want to cancel this mission? The report will be available for others.",
      [
        { text: t('COMMON.NO') || "No", style: "cancel" },
        {
          text: t('COMMON.YES') || "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await apiService.post(`/user/report/${id}/cancel`, {});
              Alert.alert(t('COMMON.SUCCESS') || "Success", t('REPORT.SUCCESS.CANCELLED') || "Mission cancelled. Report is now available for others.");
              fetchReports();
            } catch (error: any) {
               Alert.alert("Error", error?.response?.data?.message || "Cannot cancel");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleViewOnMap = (lat: number, long: number) => {
    router.push({
        pathname: "/(tabs)/map",
        params: { lat, long, focus: Date.now().toString() }
    });
  };

      const renderReportItem = useCallback(({ item }: { item: any }) => (
    <ReportCard
      item={item}
      user={user}
      handleAccept={handleAccept}
      handleReject={handleReject}
      handleResolve={handleResolve}
      handleDelete={handleDelete}
      handleCancel={handleCancel}
      setEditingReport={setEditingReport}
      handleViewOnMap={handleViewOnMap}
      isOwner={user?._id === item.by || user?._id === item.by?._id}
    />
  ), [user, handleAccept, handleReject, handleResolve, handleDelete, handleCancel, setEditingReport]);

  // --- MAIN RENDER ---
  if (!isReady) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-background">
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header Search & Filter */}
      <View className="px-4 pt-4 pb-2 flex-row gap-2">
        <AppInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
          leftIcon={<Icon name="Search" className="w-5 h-5 text-neutrals400" />}
          containerClassName="flex-1"
          className="bg-gray-50 dark:bg-neutrals800 h-12 rounded-xl border-none text-foreground"
        />
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          className={`w-12 h-12 rounded-xl items-center justify-center ${appliedTypeFilter !== "all" ? "bg-emerald-500" : "bg-gray-100 dark:bg-neutrals800"}`}
        >
          <Icon
            name="ListFilter"
            className={`w-6 h-6 ${appliedTypeFilter !== "all" ? "text-white" : "text-neutrals500"}`}
          />
        </TouchableOpacity>
      </View>

      {/* List Reports */}

      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderReportItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
           if (isLoading && page > 1) {
             return <ActivityIndicator className="mt-4" color="#10b981" />;
           }
           if (!hasMore && data.length > 0) {
             return <AppText className="text-center text-gray-400 mt-4 mb-8">No more reports</AppText>;
           }
           return <View className="h-8" />;
        }}
        ListEmptyComponent={
          !isLoading ? (
          <View className="items-center mt-20">
            <Icon name="FileQuestionMark" className="w-16 h-16 text-gray-300" />
            <AppText className="text-gray-400 mt-4">No reports found</AppText>
          </View>
          ) : null
        }
      />

      {/* Edit Modal (Đã BỎ Address Input) */}
      <ReportEditModal
        editingReport={editingReport}
        setEditingReport={setEditingReport}
        isSubmitting={isSubmitting}
        handleEditSave={handleEditSave}
      />

      {/* Filter Modal (Logic cũ) */}
      <ReportFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        tempTypeFilter={tempTypeFilter}
        setTempTypeFilter={setTempTypeFilter}
        tempStatusFilter={tempStatusFilter}
        setTempStatusFilter={setTempStatusFilter}
        onApply={() => {
          setAppliedTypeFilter(tempTypeFilter);
          setAppliedStatusFilter(tempStatusFilter);
          setAppliedSourceFilter(tempSourceFilter);
          setShowFilterModal(false);
        }}
        onReset={() => {
          setTempTypeFilter("all");
          setTempStatusFilter("all");
          setTempSourceFilter("all");
        }}
        TYPE_FILTERS={TYPE_FILTERS}
        STATUS_FILTERS={STATUS_FILTERS}
        SOURCE_FILTERS={SOURCE_FILTERS}
        tempSourceFilter={tempSourceFilter}
        setTempSourceFilter={setTempSourceFilter}
      />
    </View>
  );
}

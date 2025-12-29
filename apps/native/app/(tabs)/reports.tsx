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
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";
import { apiService } from "@/services/api.service";
import { useDebounce } from "@/hooks/useDebounce";

// Components
import { AppInput, Icon, AppText } from "@/components/ui";
import {
  ENUM_REPORT_SEVERITY,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_TYPE,
} from "@repo/shared";
import { useLocationTracking } from "@/hooks/useUserLocation";

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
  volunteer?: string;
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

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { theme, user, token  } = useAppSelector((state) => state.app);
  const { currentRegion } = useLocationTracking(token);
  // --- STATE ---
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Applied Filters
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<string>("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<string>("all");

  // Temp Filters
  const [tempTypeFilter, setTempTypeFilter] = useState<string>("all");
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");

  // Edit / Action State
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- API HANDLERS ---

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('RegionId before fetch',currentRegion)

      const params: any = {
        limit: 20,
        page: 1,
        regionId: currentRegion
      };

      if (debouncedSearch) params.q = debouncedSearch;
      if (appliedTypeFilter !== "all") params.type = appliedTypeFilter;
      if (appliedStatusFilter !== "all") params.status = appliedStatusFilter;

      const queryString = new URLSearchParams(params).toString();

      const response = await apiService.get<{ data: any[] }>(
        `/admin/report/list?${queryString}`
      );

      const reports = response.data || [];
      setData(reports);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, appliedTypeFilter, appliedStatusFilter]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
      fetchReports();
    });
    return () => task.cancel();
  }, [fetchReports]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchReports();
  };

  // 1. UPDATE REPORT
  const handleEditSave = async () => {
    if (!editingReport) return;
    try {
      setIsSubmitting(true);
      // Bỏ field address trong payload
      await apiService.post(`/report/${editingReport._id}`, {
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
            await apiService.delete(`/report/${id}`);
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
      await apiService.post(`/report/${id}/accept`, {});
      Alert.alert("Success", "You have accepted this rescue mission!");
      fetchReports();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Cannot accept report"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. REJECT/CANCEL REPORT
  const handleReject = async (id: string) => {
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
              await apiService.post(`/report/${id}/reject`, {});
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
          className="bg-gray-50 h-12 rounded-xl border-none"
        />
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          className={`w-12 h-12 rounded-xl items-center justify-center ${appliedTypeFilter !== "all" ? "bg-emerald-500" : "bg-gray-100"}`}
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
        renderItem={({ item }) => (
          <ReportCard
            item={item}
            user={user}
            handleAccept={handleAccept}
            handleReject={handleReject}
            handleDelete={handleDelete}
            setEditingReport={setEditingReport}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Icon name="FileQuestionMark" className="w-16 h-16 text-gray-300" />
            <AppText className="text-gray-400 mt-4">No reports found</AppText>
          </View>
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
          setShowFilterModal(false);
        }}
        onReset={() => {
          setTempTypeFilter("all");
          setTempStatusFilter("all");
        }}
        TYPE_FILTERS={TYPE_FILTERS}
        STATUS_FILTERS={STATUS_FILTERS}
      />
    </View>
  );
}

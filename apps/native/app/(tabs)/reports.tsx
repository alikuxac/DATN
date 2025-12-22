import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";
import { apiService } from "@/services/api.service";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/utils";

// Components
import { AppText, AppInput, Icon, Badge, AppButton } from "@/components/ui";
import { InteractionManager } from "react-native";
import {
  ENUM_REPORT_SEVERITY,
  ENUM_REPORT_STATUS,
  ENUM_REPORT_TYPE,
  ENUM_USER_ROLE,
} from "@repo/shared";
import { useLocationTracking } from "@/hooks/useUserLocation";

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
const TIME_FILTERS = [
  { label: "All Time", value: 0 },
  { label: "1h", value: 1 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
];

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

  // --- UI HELPERS ---
  const getSeverityColor = (severity: ENUM_REPORT_SEVERITY) => {
    switch (severity) {
      case ENUM_REPORT_SEVERITY.CRITICAL:
        return "bg-red-100 text-red-700 border-red-200";
      case ENUM_REPORT_SEVERITY.HIGH:
        return "bg-orange-100 text-orange-700 border-orange-200";
      case ENUM_REPORT_SEVERITY.MEDIUM:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getStatusColorClass = (status: ENUM_REPORT_STATUS) => {
    switch (status) {
      case ENUM_REPORT_STATUS.VERIFIED:
        return "text-green-600";
      case ENUM_REPORT_STATUS.RESOLVED:
        return "text-blue-600";
      case ENUM_REPORT_STATUS.IN_PROGRESS:
        return "text-yellow-600";
      case ENUM_REPORT_STATUS.REJECTED:
      case ENUM_REPORT_STATUS.CANCELLED:
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  // Helper hiển thị tọa độ
  const formatCoordinates = (coords: [number, number]) => {
    if (!coords || coords.length < 2) return "Unknown location";
    // Coords trong GeoJSON là [Long, Lat], nhưng hiển thị thường là Lat, Long
    return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
  };

  // --- RENDER CARD ---
  const renderCard = ({ item }: { item: any }) => {
    const currentUserId = user?._id?.toString();
    const isOwner = item.by === currentUserId;
    const isAdmin = user?.role === ENUM_USER_ROLE.ADMIN;
    const isVolunteer = user?.isVolunteer;

    const canEdit =
      (isOwner || isAdmin) && item.status === ENUM_REPORT_STATUS.PENDING;
    const canDelete =
      (isOwner || isAdmin) && item.status === ENUM_REPORT_STATUS.PENDING;
    const canAccept =
      isVolunteer &&
      item.status === ENUM_REPORT_STATUS.PENDING &&
      item.by !== currentUserId;
    const canReject =
      (isAdmin && item.status === ENUM_REPORT_STATUS.PENDING) ||
      (isVolunteer &&
        item.status === ENUM_REPORT_STATUS.IN_PROGRESS &&
        item.rescuer === currentUserId);

    return (
      <View className="bg-white dark:bg-neutrals900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-neutrals800">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Badge
              className={`border px-2 py-0.5 rounded-md ${getSeverityColor(item.severity)}`}
            >
              <AppText className="text-[10px] font-sans-bold uppercase">
                {item.severity} PRIORITY
              </AppText>
            </Badge>
            <AppText
              variant="heading4"
              className="font-sans-bold text-foreground mt-1 uppercase"
            >
              {item.type}
            </AppText>
          </View>
          <AppText className="text-xs text-neutrals400 font-sans-medium">
            {new Date(item.createdAt).toLocaleDateString()}
          </AppText>
        </View>

        {/* Info - Coordinates replace Address */}
        <View className="gap-2 mb-4">
          <View className="flex-row items-center">
            <Icon name="MapPin" className="w-4 h-4 text-neutrals400 mr-2" />
            <AppText
              className="text-sm text-foreground flex-1"
              numberOfLines={1}
            >
              {/* Hiển thị tọa độ ở đây */}
              {formatCoordinates(item.location.coordinates)}
            </AppText>
          </View>
          {item.notes && (
            <View className="bg-gray-50 dark:bg-neutrals800 p-3 rounded-lg">
              <AppText className="text-sm text-foreground italic">
                "{item.notes}"
              </AppText>
            </View>
          )}
        </View>

        {/* Footer Stats */}
        <View className="flex-row justify-between items-center py-3 border-t border-gray-100 dark:border-neutrals800">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Icon name="Users" className="w-3.5 h-3.5 text-neutrals400" />
              <AppText className="text-sm font-sans-bold text-foreground">
                {item.peopleCount}
              </AppText>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon
                name="Activity"
                className={`w-3.5 h-3.5 ${getStatusColorClass(item.status)}`}
              />
              <AppText
                className={`text-sm font-sans-bold capitalize ${getStatusColorClass(item.status)}`}
              >
                {item.status.replace("_", " ")}
              </AppText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-end gap-2 mt-2">
          {canAccept && (
            <TouchableOpacity
              onPress={() => handleAccept(item._id)}
              className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Icon name="HandHelping" className="w-4 h-4 text-white mr-2" />
              <AppText className="text-white font-sans-bold text-xs">
                Accept
              </AppText>
            </TouchableOpacity>
          )}
          {canReject && (
            <TouchableOpacity
              onPress={() => handleReject(item._id)}
              className="bg-red-100 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Icon name="CircleX" className="w-4 h-4 text-red-600 mr-2" />
              <AppText className="text-red-600 font-sans-bold text-xs">
                {isAdmin ? "Reject" : "Abort"}
              </AppText>
            </TouchableOpacity>
          )}
          {canEdit && (
            <TouchableOpacity
              onPress={() => setEditingReport(item)}
              className="bg-gray-100 dark:bg-neutrals800 px-3 py-2 rounded-lg"
            >
              <Icon name="Pencil" className="w-4 h-4 text-neutrals600" />
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              onPress={() => handleDelete(item._id)}
              className="bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
            >
              <Icon name="Trash2" className="w-4 h-4 text-red-500" />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
        renderItem={renderCard}
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
      <Modal visible={!!editingReport} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-neutrals900 h-[85%] rounded-t-3xl p-6">
            <View className="flex-row justify-between mb-6">
              <AppText variant="heading4">Update Report</AppText>
              <TouchableOpacity onPress={() => setEditingReport(null)}>
                <Icon name="X" className="w-6 h-6" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Hiển thị tọa độ dạng Text Read-only để user biết vị trí */}
              <View className="bg-gray-50 p-3 rounded-xl mb-4 flex-row items-center">
                <Icon name="MapPin" className="w-4 h-4 text-gray-400 mr-2" />
                <AppText className="text-gray-500 font-sans-medium">
                  Location:{" "}
                  {editingReport &&
                    formatCoordinates(editingReport.coordinates)}
                </AppText>
              </View>

              <AppText className="font-bold mb-2">Description</AppText>
              <AppInput
                value={editingReport?.description}
                onChangeText={(t) =>
                  setEditingReport((prev:any) =>
                    prev ? { ...prev, description: t } : null
                  )
                }
                variant="textarea"
                className="h-32"
              />

              <AppText className="font-bold mt-4 mb-2">People Count</AppText>
              <AppInput
                value={editingReport?.peopleCount.toString()}
                onChangeText={(t) =>
                  setEditingReport((prev: any) =>
                    prev ? { ...prev, peopleCount: parseInt(t) || 0 } : null
                  )
                }
                keyboardType="numeric"
              />

              <AppText className="font-bold mt-4 mb-2">Severity</AppText>
              <View className="flex-row gap-2 flex-wrap">
                {Object.values(ENUM_REPORT_SEVERITY).map((sev) => (
                  <TouchableOpacity
                    key={sev}
                    onPress={() =>
                      setEditingReport((prev: any) =>
                        prev ? { ...prev, severity: sev } : null
                      )
                    }
                    className={`px-3 py-2 rounded-lg border ${editingReport?.severity === sev ? "bg-blue-600 border-blue-600" : "border-gray-200"}`}
                  >
                    <AppText
                      className={
                        editingReport?.severity === sev
                          ? "text-white"
                          : "text-gray-600"
                      }
                    >
                      {sev.toUpperCase()}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <AppButton
              onPress={handleEditSave}
              disabled={isSubmitting}
              className="mt-4 bg-blue-600 rounded-xl"
              textClassname="text-white font-bold"
            >
              {isSubmitting ? "Saving..." : "Confirm Update"}
            </AppButton>
          </View>
        </View>
      </Modal>

      {/* Filter Modal (Logic cũ) */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-neutrals900 h-[70%] rounded-t-3xl flex-col">
            <View className="p-4 border-b border-gray-100 flex-row justify-between">
              <AppText className="font-bold text-lg">Filters</AppText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="X" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <AppText className="font-bold text-gray-500 mb-3">
                REPORT TYPE
              </AppText>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {TYPE_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => setTempTypeFilter(f.value)}
                    className={`px-4 py-2 rounded-full border ${tempTypeFilter === f.value ? "bg-emerald-500 border-emerald-500" : "border-gray-200"}`}
                  >
                    <AppText
                      className={
                        tempTypeFilter === f.value
                          ? "text-white"
                          : "text-gray-700"
                      }
                    >
                      {f.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText className="font-bold text-gray-500 mb-3">STATUS</AppText>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.value}
                    onPress={() => setTempStatusFilter(f.value)}
                    className={`px-4 py-2 rounded-full border ${tempStatusFilter === f.value ? "bg-blue-500 border-blue-500" : "border-gray-200"}`}
                  >
                    <AppText
                      className={
                        tempStatusFilter === f.value
                          ? "text-white"
                          : "text-gray-700"
                      }
                    >
                      {f.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View className="p-4 border-t border-gray-100 flex-row gap-3">
              <AppButton
                variant="outline"
                className="flex-1 rounded-xl"
                onPress={() => {
                  setTempTypeFilter("all");
                  setTempStatusFilter("all");
                }}
              >
                Reset
              </AppButton>
              <AppButton
                className="flex-1 bg-emerald-500 rounded-xl"
                textClassname="text-white font-bold"
                onPress={() => {
                  setAppliedTypeFilter(tempTypeFilter);
                  setAppliedStatusFilter(tempStatusFilter);
                  setShowFilterModal(false);
                }}
              >
                Apply
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

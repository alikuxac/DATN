import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme } from "@/store/slices/appSlice";

// Components
import { AppText, AppInput, Icon, Badge, AppButton } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { cn } from "@/utils";

// --- DEFINITIONS ---

// 👇 ĐỔI ROLE ĐỂ TEST: 'user' | 'volunteer' | 'admin'
const CURRENT_USER = {
  id: "user123",
  name: "Nguyen Van A",
  role: "admin" as "user" | "volunteer" | "admin",
};

interface Report {
  _id: string;
  userId: string;
  authorName: string;
  type: "food" | "water" | "medical" | "evacuation";
  location: { type: "Point"; coordinates: [number, number] };
  address: string;
  notes: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "rejected" | "verified" | "in_progress" | "resolved";
  peopleCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- MOCK DATA (Dữ liệu mẫu dài hơn) ---
const now = new Date();
// Helper để tạo thời gian lùi lại
const subHours = (h: number) =>
  new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const subDays = (d: number) =>
  new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const mockReports: Report[] = [
  // Report của CURRENT_USER (user123)
  {
    _id: "r1",
    userId: "user123",
    authorName: "Nguyen Van A",
    type: "food",
    location: { type: "Point", coordinates: [106.7009, 10.7769] },
    address: "123 Nguyen Hue, Q1, HCMC",
    notes: "Cần hỗ trợ lương thực cho 5 người già, nước ngập sâu.",
    severity: "high",
    status: "pending",
    peopleCount: 5,
    isPublic: true,
    createdAt: subHours(0.5), // Vừa xong
    updatedAt: subHours(0.5),
  },
  {
    _id: "r4",
    userId: "user123",
    authorName: "Nguyen Van A",
    type: "evacuation",
    location: { type: "Point", coordinates: [106.71, 10.78] },
    address: "Hẻm 50 Thành Thái, Q10",
    notes: "Nước lên nhanh, cần xuồng cứu hộ gấp.",
    severity: "critical",
    status: "in_progress",
    peopleCount: 3,
    isPublic: true,
    createdAt: subDays(1), // Hôm qua
    updatedAt: subHours(2),
  },

  // Report của người khác
  {
    _id: "r2",
    userId: "user456",
    authorName: "Tran Thi B",
    type: "medical",
    location: { type: "Point", coordinates: [106.68, 10.76] },
    address: "456 Le Loi, Q1, HCMC",
    notes: "Có người bị thương cần sơ cứu, gãy chân.",
    severity: "critical",
    status: "verified",
    peopleCount: 1,
    isPublic: true,
    createdAt: subHours(2),
    updatedAt: subHours(1),
  },
  {
    _id: "r3",
    userId: "user789",
    authorName: "Le Van C",
    type: "water",
    location: { type: "Point", coordinates: [106.69, 10.79] },
    address: "789 CMT8, Q3, HCMC",
    notes: "Thiếu nước sạch sinh hoạt đã 2 ngày.",
    severity: "medium",
    status: "rejected", // Đã bị từ chối (Volunteer sẽ không thấy)
    peopleCount: 10,
    isPublic: true,
    createdAt: subHours(5),
    updatedAt: subHours(4),
  },
  {
    _id: "r5",
    userId: "user999",
    authorName: "Pham Van D",
    type: "food",
    location: { type: "Point", coordinates: [106.65, 10.75] },
    address: "Chung cư Carina, Q8",
    notes: "Cần mì tôm và sữa cho trẻ em.",
    severity: "medium",
    status: "resolved", // Đã xong
    peopleCount: 4,
    isPublic: true,
    createdAt: subDays(2),
    updatedAt: subDays(1),
  },
  {
    _id: "r6",
    userId: "user888",
    authorName: "Hoang Thi E",
    type: "medical",
    location: { type: "Point", coordinates: [106.64, 10.74] },
    address: "Khu dân cư Bình Phú, Q6",
    notes: "Cần thuốc hạ sốt và men tiêu hóa.",
    severity: "low",
    status: "pending",
    peopleCount: 2,
    isPublic: true,
    createdAt: subHours(1),
    updatedAt: subHours(1),
  },
  {
    _id: "r7",
    userId: "user777",
    authorName: "Vo Van F",
    type: "evacuation",
    location: { type: "Point", coordinates: [106.63, 10.73] },
    address: "Bến Bình Đông, Q8",
    notes: "Triều cường lên cao, nhà sắp ngập.",
    severity: "high",
    status: "verified",
    peopleCount: 6,
    isPublic: true,
    createdAt: subHours(3),
    updatedAt: subHours(2),
  },
];

// --- FILTER OPTIONS ---
const TIME_FILTERS = [
  { label: "All Time", value: 0 },
  { label: "1h", value: 1 },
  { label: "3h", value: 3 },
  { label: "6h", value: 6 },
  { label: "12h", value: 12 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
];

const TYPE_FILTERS = [
  { label: "All Types", value: "all" },
  { label: "Food", value: "food" },
  { label: "Water", value: "water" },
  { label: "Medical", value: "medical" },
  { label: "Evacuation", value: "evacuation" },
];

const STATUS_FILTERS = [
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Rejected", value: "rejected" },
];

export default function ReportsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.app);
  const colors = useColors();

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Applied Filters
  const [appliedTimeFilter, setAppliedTimeFilter] = useState(0);
  const [appliedTypeFilter, setAppliedTypeFilter] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");

  // Temp Filters
  const [tempTimeFilter, setTempTimeFilter] = useState(0);
  const [tempTypeFilter, setTempTypeFilter] = useState("all");
  const [tempStatusFilter, setTempStatusFilter] = useState("all");

  // Edit/Action State
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [statusTargetReport, setStatusTargetReport] = useState<Report | null>(
    null
  );

  // --- LOGIC FILTER CHÍNH ---
  const filteredData = useMemo(() => {
    return mockReports.filter((item) => {
      // 1. Role Logic (Quan trọng)
      // Nếu là User thường: CHỈ thấy bài của chính mình
      if (CURRENT_USER.role === "user" && item.userId !== CURRENT_USER.id) {
        return false;
      }

      // Nếu là Volunteer: KHÔNG thấy bài bị từ chối (Rejected)
      if (CURRENT_USER.role === "volunteer" && item.status === "rejected") {
        return false;
      }

      // 2. Search Filter (Address, Notes, Author)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match =
          item.address.toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query) ||
          item.authorName.toLowerCase().includes(query);
        if (!match) return false;
      }

      // 3. Time Filter
      if (appliedTimeFilter > 0) {
        const createdTime = new Date(item.createdAt).getTime();
        const cutoffTime =
          new Date().getTime() - appliedTimeFilter * 60 * 60 * 1000;
        if (createdTime < cutoffTime) return false;
      }

      // 4. Type Filter
      if (appliedTypeFilter !== "all" && item.type !== appliedTypeFilter)
        return false;

      // 5. Status Filter
      if (appliedStatusFilter !== "all" && item.status !== appliedStatusFilter)
        return false;

      return true;
    });
  }, [
    searchQuery,
    appliedTimeFilter,
    appliedTypeFilter,
    appliedStatusFilter,
    CURRENT_USER.role,
  ]);

  // --- HANDLERS ---
  const handleOpenFilter = () => {
    setTempTimeFilter(appliedTimeFilter);
    setTempTypeFilter(appliedTypeFilter);
    setTempStatusFilter(appliedStatusFilter);
    setShowFilterModal(true);
  };

  const handleResetFilter = () => {
    setTempTimeFilter(0);
    setTempTypeFilter("all");
    setTempStatusFilter("all");
  };

  const handleApplyFilter = () => {
    setAppliedTimeFilter(tempTimeFilter);
    setAppliedTypeFilter(tempTypeFilter);
    setAppliedStatusFilter(tempStatusFilter);
    setShowFilterModal(false);
  };

  const handleEditSave = () => {
    setEditingReport(null);
    Alert.alert("Success", "Report updated successfully");
  };

  const handleChangeStatus = (newStatus: string) => {
    setStatusTargetReport(null);
    Alert.alert("Success", `Status changed to ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => console.log("Deleted", id),
      },
    ]);
  };

  // --- STYLES HELPER ---
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "verified":
        return "text-[#22c55e]";
      case "resolved":
        return "text-[#3b82f6]";
      case "in_progress":
        return "text-[#f59e0b]";
      case "rejected":
        return "text-[#ef4444]";
      default:
        return "text-[#94a3b8]";
    }
  };

  // Helper format ngày giờ đẹp
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    // Format: HH:mm - DD/MM/YYYY
    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const day = date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${time} - ${day}`;
  };

  // --- SUB-COMPONENTS ---
  const FilterSection = ({ title, data, selectedValue, onSelect }: any) => (
    <View className="mb-6">
      <AppText className="text-sm font-sans-bold text-neutrals500 mb-3 uppercase tracking-wider">
        {title}
      </AppText>
      <View className="flex-row flex-wrap gap-3">
        {data.map((opt: any) => {
          const isActive = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              className={cn(
                "px-4 py-2 rounded-xl border",
                isActive
                  ? "bg-[#10b981] border-[#10b981]"
                  : "bg-transparent border-gray-200 dark:border-neutrals700"
              )}
            >
              <AppText
                className={cn(
                  "font-sans-medium text-sm",
                  isActive ? "text-white" : "text-foreground"
                )}
              >
                {opt.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // --- RENDER CARD ---
  const renderCard = ({ item }: { item: Report }) => {
    const isOwner = item.userId === CURRENT_USER.id;
    const isAdmin = CURRENT_USER.role === "admin";

    const canEdit = isOwner || isAdmin;
    const canDelete = isOwner || isAdmin;
    const canChangeStatus = isAdmin;
    const statusColor = getStatusColorClass(item.status);

    return (
      <View className="bg-white dark:bg-neutrals900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-neutrals800">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <AppText
              variant="heading4"
              className="font-sans-bold text-foreground mb-1"
            >
              {item.type.toUpperCase()} REQUEST
            </AppText>
            {/* 👇 Sử dụng format ngày giờ mới */}
            <AppText className="text-xs text-neutrals400 font-sans-medium">
              {formatDateTime(item.createdAt)}
            </AppText>
          </View>
          <Badge
            variant="secondary"
            className="capitalize bg-slate-100 dark:bg-slate-800"
          >
            {item.severity}
          </Badge>
        </View>

        {/* Body */}
        <View className="gap-2 mb-4">
          <View className="flex-row items-center">
            <Icon name="User" className="w-4 h-4 text-neutrals400 mr-2" />
            <AppText className="text-sm font-sans-medium text-foreground">
              {item.authorName}
            </AppText>
          </View>
          <View className="flex-row items-center">
            <Icon name="MapPin" className="w-4 h-4 text-neutrals400 mr-2" />
            <AppText
              className="text-sm text-foreground flex-1"
              numberOfLines={1}
            >
              {item.address}
            </AppText>
          </View>
          {item.notes && (
            <View className="bg-gray-50 dark:bg-neutrals800 p-3 rounded-lg mt-1">
              <AppText className="text-sm text-foreground italic">
                "{item.notes}"
              </AppText>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100 dark:border-neutrals800">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Icon name="Users" className="w-3.5 h-3.5 text-neutrals400" />
              <AppText className="text-sm font-sans-bold text-foreground">
                {item.peopleCount}
              </AppText>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon
                name={item.status === "verified" ? "CheckCheck" : "Clock"}
                className={`w-3.5 h-3.5 ${statusColor}`}
              />
              <AppText
                className={`text-sm font-sans-bold capitalize ${statusColor}`}
              >
                {item.status.replace("_", " ")}
              </AppText>
            </View>
          </View>
        </View>

        {/* Actions */}
        {(canEdit || canChangeStatus) && (
          <View className="flex-row justify-end gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-neutrals800">
            {canChangeStatus && (
              <TouchableOpacity
                onPress={() => setStatusTargetReport(item)}
                className="flex-row items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg"
              >
                <Icon
                  name="RefreshCw"
                  className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mr-1.5"
                />
                <AppText className="text-xs font-sans-bold text-blue-600 dark:text-blue-400">
                  Status
                </AppText>
              </TouchableOpacity>
            )}
            {canEdit && (
              <TouchableOpacity
                onPress={() => setEditingReport(item)}
                className="flex-row items-center bg-gray-50 dark:bg-neutrals800 px-3 py-1.5 rounded-lg"
              >
                <Icon
                  name="Pencil"
                  className="w-3.5 h-3.5 text-neutrals500 mr-1.5"
                />
                <AppText className="text-xs font-sans-bold text-neutrals500">
                  Edit
                </AppText>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                onPress={() => handleDelete(item._id)}
                className="flex-row items-center bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg"
              >
                <Icon
                  name="Trash2"
                  className="w-3.5 h-3.5 text-red-500 mr-1.5"
                />
                <AppText className="text-xs font-sans-bold text-red-500">
                  Delete
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-background">
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* HEADER */}
      <View className="bg-white dark:bg-background pt-safe-offset-0 pb-2 px-4 border-b border-gray-100 dark:border-neutrals800">
        <SafeAreaView>
          <View className="flex-row items-center justify-between h-[50px]">
            <View className="w-10" />
            <AppText className="text-lg font-sans-bold text-foreground">
              Reports
            </AppText>
            <TouchableOpacity
              onPress={() => dispatch(toggleTheme())}
              className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-neutrals800 rounded-full"
            >
              <Icon
                name={theme === "dark" ? "Sun" : "Moon"}
                className="w-5 h-5 text-foreground"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <View className="flex-1 px-4 pt-4">
        {/* Search & Filter Bar */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1">
            <AppInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search author..."
              leftIcon={
                <Icon name="Search" className="w-5 h-5 text-neutrals400" />
              }
              containerClassName="border-0"
              className="bg-gray-50 dark:bg-neutrals900 border border-gray-200 dark:border-neutrals800 h-12 rounded-xl"
            />
          </View>

          <TouchableOpacity
            onPress={handleOpenFilter}
            className="w-12 h-12 bg-[#10b981] rounded-xl items-center justify-center shadow-sm active:opacity-80"
          >
            <Icon name="ListFilter" className="w-6 h-6 text-white" />
          </TouchableOpacity>
        </View>

        {/* List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-10">
              <Icon
                name="FileQuestionMark"
                className="w-12 h-12 text-neutrals300"
              />
              <AppText className="text-neutrals400 mt-2">
                No reports found
              </AppText>
            </View>
          }
        />
      </View>

      {/* --- FILTER MODAL --- */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-neutrals900 rounded-t-3xl h-[85%] flex-col">
            <View className="flex-row justify-between items-center p-6 border-b border-gray-100 dark:border-neutrals800">
              <AppText className="text-xl font-sans-bold text-foreground">
                Bộ lọc
              </AppText>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="p-1"
              >
                <Icon name="X" className="w-6 h-6 text-neutrals400" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 24 }}
            >
              <FilterSection
                title="Khoảng thời gian"
                data={TIME_FILTERS}
                selectedValue={tempTimeFilter}
                onSelect={setTempTimeFilter}
              />
              <FilterSection
                title="Loại báo cáo"
                data={TYPE_FILTERS}
                selectedValue={tempTypeFilter}
                onSelect={setTempTypeFilter}
              />
              <FilterSection
                title="Trạng thái"
                data={STATUS_FILTERS}
                selectedValue={tempStatusFilter}
                onSelect={setTempStatusFilter}
              />
            </ScrollView>

            <View className="p-6 border-t border-gray-100 dark:border-neutrals800 flex-row gap-3 bg-white dark:bg-neutrals900">
              <AppButton
                variant="outline"
                className="flex-1 h-12 rounded-xl border-gray-200 dark:border-neutrals700"
                onPress={handleResetFilter}
              >
                Thiết lập lại
              </AppButton>
              <AppButton
                className="flex-1 h-12 rounded-xl bg-[#10b981]"
                textClassname="text-white font-sans-bold text-lg"
                onPress={handleApplyFilter}
              >
                Áp dụng
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- EDIT/STATUS MODALS (Giữ nguyên như file trước) --- */}
      <Modal visible={!!editingReport} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white dark:bg-neutrals900 rounded-t-3xl p-6 h-[80%] flex-col">
            <View className="flex-row justify-between items-center mb-6">
              <AppText className="text-xl font-sans-bold text-foreground">
                Edit Report
              </AppText>
              <TouchableOpacity onPress={() => setEditingReport(null)}>
                <Icon name="X" className="w-6 h-6 text-neutrals400" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="gap-4">
                <View>
                  <AppText className="text-sm font-sans-bold text-neutrals500 mb-2">
                    Address
                  </AppText>
                  <AppInput
                    value={editingReport?.address}
                    onChangeText={(t) =>
                      setEditingReport((prev: any) =>
                        prev ? { ...prev, address: t } : null
                      )
                    }
                  />
                </View>
                <View>
                  <AppText className="text-sm font-sans-bold text-neutrals500 mb-2">
                    Notes
                  </AppText>
                  <AppInput
                    value={editingReport?.notes}
                    onChangeText={(t) =>
                      setEditingReport((prev: any) =>
                        prev ? { ...prev, notes: t } : null
                      )
                    }
                    variant="textarea"
                  />
                </View>
                <View>
                  <AppText className="text-sm font-sans-bold text-neutrals500 mb-2">
                    People Count
                  </AppText>
                  <AppInput
                    value={editingReport?.peopleCount?.toString()}
                    onChangeText={(t) =>
                      setEditingReport((prev: any) =>
                        prev ? { ...prev, peopleCount: parseInt(t) || 0 } : null
                      )
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mt-2">
                  <View className="flex-row items-center mb-2">
                    <Icon
                      name="Wallet"
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2"
                    />
                    <AppText className="text-sm font-sans-bold text-blue-600 dark:text-blue-400">
                      Emergency Topup
                    </AppText>
                  </View>
                  <AppText className="text-xs text-blue-500 mb-3">
                    Add more resources/funds.
                  </AppText>
                  <AppButton
                    size="sm"
                    className="bg-blue-600 h-10 rounded-lg"
                    textClassname="text-white font-sans-bold"
                    onPress={() => Alert.alert("Topup", "Feature coming soon!")}
                  >
                    Topup Now
                  </AppButton>
                </View>
              </View>
            </ScrollView>
            <View className="pt-4 border-t border-gray-100 dark:border-neutrals800">
              <AppButton
                onPress={handleEditSave}
                className="w-full bg-[#2563eb] h-12 rounded-xl"
                textClassname="text-white font-sans-bold"
              >
                Save Changes
              </AppButton>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!statusTargetReport} transparent animationType="fade">
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-white dark:bg-neutrals900 w-full rounded-2xl p-6">
            <AppText className="text-lg font-sans-bold text-foreground mb-4 text-center">
              Change Status
            </AppText>
            <View className="gap-3">
              {[
                "pending",
                "verified",
                "in_progress",
                "resolved",
                "rejected",
              ].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleChangeStatus(status)}
                  className={cn(
                    "py-3 rounded-xl border border-gray-100 dark:border-neutrals800 items-center",
                    statusTargetReport?.status === status
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200"
                      : "bg-transparent"
                  )}
                >
                  <AppText
                    className={cn(
                      "font-sans-bold capitalize",
                      getStatusColorClass(status)
                    )}
                  >
                    {status.replace("_", " ")}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
            <AppButton
              onPress={() => setStatusTargetReport(null)}
              variant="ghost"
              className="mt-4"
              textClassname="text-neutrals500"
            >
              Cancel
            </AppButton>
          </View>
        </View>
      </Modal>
    </View>
  );
}

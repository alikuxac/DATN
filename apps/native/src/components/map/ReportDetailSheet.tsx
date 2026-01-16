import React from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { AppText, AppButton, Icon, Avatar } from "@/components/ui";
import { cn } from "@/utils";
import { ENUM_REPORT_STATUS, ENUM_USER_ROLE } from "@repo/shared";
import { Navigation, Phone } from "lucide-react-native";
import { formatTimeAgo, isUserOnline } from "@/utils/date";

interface ReportDetailSheetProps {
  selectedReport: any;
  onClose: () => void;
  isVolunteerMode: boolean;
  user: any;
  isActionLoading: boolean;
  handleReportAction: (action: "accept" | "reject" | "cancel" | "complete") => void;
  handleCall: (phone?: string) => void;
}

export const ReportDetailSheet = ({
  selectedReport,
  onClose,
  isVolunteerMode,
  user,
  isActionLoading,
  handleReportAction,
  handleCall,
}: ReportDetailSheetProps) => {
  const getPinColorClass = (status: ENUM_REPORT_STATUS) => {
    switch (status) {
      case ENUM_REPORT_STATUS.PENDING:
        return "bg-red-500 border-red-200";
      case ENUM_REPORT_STATUS.IN_PROGRESS:
        return "bg-yellow-500 border-yellow-200";
      case ENUM_REPORT_STATUS.VERIFIED:
        return "bg-blue-500 border-blue-200";
      case ENUM_REPORT_STATUS.RESOLVED:
        return "bg-green-500 border-green-200";
      default:
        return "bg-gray-500 border-gray-200";
    }
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutrals900 rounded-t-3xl shadow-2xl z-50 max-h-[50%]">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center gap-2 mb-1">
              <View
                className={cn(
                  "px-2 py-0.5 rounded text-[10px]",
                  getPinColorClass(selectedReport.status).split(" ")[0]
                )}
              >
                <AppText className="text-white font-bold uppercase">
                  {selectedReport.status}
                </AppText>
              </View>
              <AppText className="text-gray-400 text-xs">
                {new Date(selectedReport.createdAt).toLocaleTimeString()} -{" "}
                {new Date(selectedReport.createdAt).toLocaleDateString()}
              </AppText>
            </View>
            <AppText variant="heading4" className="font-bold text-foreground">
              {selectedReport.title || "Khẩn cấp: " + selectedReport.type}
            </AppText>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="p-1 bg-gray-100 rounded-full"
          >
            <Icon name="X" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <AppText className="text-gray-600 dark:text-gray-300 mb-4">
          {selectedReport.description || "Không có mô tả chi tiết."}
        </AppText>

        <View className="flex-row gap-4 mb-4">
          <View className="bg-gray-50 dark:bg-neutrals800 p-2 rounded-lg flex-1 items-center">
            <AppText className="text-xs text-gray-400">Số người</AppText>
            <AppText className="font-bold text-lg">
              {selectedReport.peopleCount}
            </AppText>
          </View>
          <View className="bg-gray-50 dark:bg-neutrals800 p-2 rounded-lg flex-1 items-center">
            <AppText className="text-xs text-gray-400">Mức độ</AppText>
            <AppText className="font-bold text-lg text-red-500">
              {selectedReport.severity}
            </AppText>
          </View>
        </View>

        {/* Info User (Người tạo) */}
        {selectedReport.user && (
          <View className="flex-row items-center justify-between mb-6 bg-gray-50 dark:bg-neutrals800 p-3 rounded-xl">
            <View className="flex-row items-center">
              <Avatar size="md" text={selectedReport.user.firstName} />
              <View className="ml-3">
                <AppText className="text-xs text-gray-400">
                  Người cần cứu
                </AppText>
                <AppText className="font-bold">
                  {selectedReport.user.firstName} {selectedReport.user.lastName}
                </AppText>
                {/* Online Status của Victim */}
                <View className="flex-row items-center gap-1 mt-0.5">
                   <View 
                    className={`w-1.5 h-1.5 rounded-full ${
                      isUserOnline(selectedReport.user?.lastLocationAt) ? 'bg-green-500' : 'bg-gray-400'
                    }`} 
                  />
                  <AppText className="text-[10px] text-gray-400">
                    {formatTimeAgo(selectedReport.user?.lastLocationAt)}
                  </AppText>
                </View>
              </View>
            </View>
            {/* Chỉ hiện nút gọi nếu là Volunteer/Admin */}
            {(isVolunteerMode || user?.role === ENUM_USER_ROLE.ADMIN) && (
              <TouchableOpacity
                onPress={() => handleCall(selectedReport.user?.phone)}
                className="bg-green-500 p-2 rounded-full"
              >
                <Phone size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ACTION BUTTONS (Logic quan trọng) */}
        <View className="flex-row gap-3">
          {/* 1. Nếu là VOLUNTEER và Report đang PENDING -> Nút NHẬN */}
          {isVolunteerMode &&
            selectedReport.status === ENUM_REPORT_STATUS.PENDING && (
              <AppButton
                disabled={isActionLoading}
                onPress={() => handleReportAction("accept")}
                className="flex-1 bg-blue-600 rounded-xl"
                textClassname="text-white font-bold"
              >
                {isActionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  "TIẾP NHẬN CỨU TRỢ"
                )}
              </AppButton>
            )}

          {/* 2. Nếu là VOLUNTEER và Report đang IN_PROGRESS (của mình) -> Nút HỦY/HOÀN THÀNH */}
          {isVolunteerMode &&
            selectedReport.status === ENUM_REPORT_STATUS.IN_PROGRESS &&
            selectedReport.volunteer === user?._id && (
              <View className="flex-1 flex-row gap-2">
                 <AppButton
                  disabled={isActionLoading}
                  onPress={() => handleReportAction("reject")}
                  className="flex-1 bg-red-100 rounded-xl"
                  textClassname="text-red-600 font-bold"
                >
                  HỦY
                </AppButton>
                <AppButton
                  disabled={isActionLoading}
                  onPress={() => handleReportAction("complete")}
                  className="flex-[2] bg-green-600 rounded-xl shadow-md elevation-3"
                  textClassname="text-white font-bold text-lg"
                >
                  {isActionLoading ? <ActivityIndicator color="white" /> : "ĐÃ HOÀN THÀNH"}
                </AppButton>
              </View>
            )}

          {/* 3. Nút Chỉ Đường (Chung cho tất cả) */}
          <AppButton
            variant="outline"
            className="w-14 rounded-xl items-center justify-center border-gray-300"
            onPress={() =>
              Alert.alert("Coming Soon", "Mở Google Map chỉ đường...")
            }
          >
            <Navigation size={20} color="black" />
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
};

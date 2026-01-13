import React from "react";
import { View, TouchableOpacity } from "react-native";
import { AppText, Icon, Badge } from "@/components/ui";
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_STATUS, ENUM_USER_ROLE } from "@repo/shared";

interface ReportCardProps {
  item: any;
  user: any;
  handleAccept: (id: string) => void;
  handleReject: (id: string) => void;
  handleDelete: (id: string) => void;
  setEditingReport: (report: any) => void;
}

export const ReportCard = ({
  item,
  user,
  handleAccept,
  handleReject,
  handleDelete,
  setEditingReport,
}: ReportCardProps) => {
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

  const formatCoordinates = (coords: [number, number]) => {
    if (!coords || coords.length < 2) return "Unknown location";
    return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
  };

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

      {/* Phone Numbers (if available and not masked/hidden by backend) */}
      <View className="mb-4 gap-1">
         {item.by && typeof item.by === 'object' && (item.by as any).mobileNumber && (
             <View className="flex-row items-center">
                 <Icon name="Phone" className="w-3.5 h-3.5 text-neutrals400 mr-2" />
                 <AppText className="text-xs text-neutrals500">
                     Reporter: <AppText className="text-foreground font-sans-medium">{(item.by as any).mobileNumber}</AppText>
                 </AppText>
             </View>
         )}
         {item.user && typeof item.user === 'object' && (item.user as any).mobileNumber && item.user._id !== item.by._id && (
             <View className="flex-row items-center">
                 <Icon name="Phone" className="w-3.5 h-3.5 text-neutrals400 mr-2" />
                  <AppText className="text-xs text-neutrals500">
                     Victim: <AppText className="text-foreground font-sans-medium">{(item.user as any).mobileNumber}</AppText>
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

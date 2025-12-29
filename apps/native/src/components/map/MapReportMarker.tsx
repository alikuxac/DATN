import React from "react";
import { View } from "react-native";
import { PointAnnotation } from "@vietmap/vietmap-gl-react-native";
import { Icon } from "@/components/ui";
import { cn } from "@/utils";
import { ENUM_REPORT_STATUS, ENUM_REPORT_TYPE } from "@repo/shared";

interface MapReportMarkerProps {
  report: any;
  onSelected: (report: any) => void;
}

export const MapReportMarker = ({ report, onSelected }: MapReportMarkerProps) => {
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
    <PointAnnotation
      id={report._id}
      coordinate={
        report.coordinates || [report.location.lng, report.location.lat]
      }
      onSelected={() => onSelected(report)}
    >
      <View
        className={cn(
          "w-10 h-10 rounded-full border-2 items-center justify-center shadow-lg",
          getPinColorClass(report.status)
        )}
      >
        <Icon
          name={
            report.type === ENUM_REPORT_TYPE.MEDICAL
              ? "Stethoscope"
              : report.type === ENUM_REPORT_TYPE.FOOD
                ? "Utensils"
                : "TriangleAlert"
          }
          size={20}
          color="white"
        />
      </View>
    </PointAnnotation>
  );
};

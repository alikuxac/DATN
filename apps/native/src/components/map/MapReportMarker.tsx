import React from "react";
import { View, StyleSheet } from "react-native";
import { PointAnnotation } from "@vietmap/vietmap-gl-react-native";
import { ENUM_REPORT_STATUS, ENUM_REPORT_TYPE } from "@repo/shared";
import {
  Waves,
  Droplets,
  CloudRainWind,
  CircleHelp,
} from "lucide-react-native";

interface MapReportMarkerProps {
  report: any;
  onSelected: (report: any) => void;
}

const ReportIcon = ({
  type,
  size,
  color,
}: {
  type: ENUM_REPORT_TYPE;
  size: number;
  color: string;
}) => {
  switch (type) {
    case ENUM_REPORT_TYPE.MEDICAL:
      return <Waves size={size} color={color} />;
    case ENUM_REPORT_TYPE.FOOD:
      return <Droplets size={size} color={color} />;
    case "FLOOD" as any:
      return <CloudRainWind size={size} color={color} />;
    default:
      return <CircleHelp size={size} color={color} />;
  }
};

export const MapReportMarker = React.memo(
  ({ report, onSelected }: MapReportMarkerProps) => {
    const getStatusStyle = (status: ENUM_REPORT_STATUS) => {
      switch (status) {
        case ENUM_REPORT_STATUS.PENDING:
          return styles.pending;
        case ENUM_REPORT_STATUS.IN_PROGRESS:
          return styles.inProgress;
        case ENUM_REPORT_STATUS.RESOLVED:
          return styles.resolved;
        default:
          return styles.default;
      }
    };

    // Safe coordinate extraction with fallbacks
    // GeoJSON pattern: location: { coordinates: [lng, lat] }
    const lng = report.location?.coordinates?.[0] ?? report.coordinates?.[0] ?? report.location?.lng;
    const lat = report.location?.coordinates?.[1] ?? report.coordinates?.[1] ?? report.location?.lat;
    
    // Validate if we have valid numbers for coordinates
    const isValidCoords = typeof lng === 'number' && typeof lat === 'number';
    const coords: [number, number] = [lng ?? 0, lat ?? 0];

    if (!isValidCoords) return null;

    return (
      <PointAnnotation
        id={report._id}
        coordinate={coords}
        onSelected={() => onSelected(report)}
      >
        <View style={styles.markerContainer}>
          <View style={[styles.markerPin, getStatusStyle(report.status)]}>
            <View style={styles.iconWrapper}>
              <ReportIcon type={report.type} size={28} color="white" />
            </View>
          </View>
          <View style={[styles.pinTip, { borderTopColor: getStatusColor(report.status) }]} />
        </View>
      </PointAnnotation>
    );
  },
  (prev, next) => {
    return (
      prev.report._id === next.report._id &&
      prev.report.status === next.report.status &&
      prev.report.type === next.report.type &&
      prev.report.location?.lat === next.report.location?.lat &&
      prev.report.location?.lng === next.report.location?.lng
    );
  }
);

const getStatusColor = (status: ENUM_REPORT_STATUS) => {
  switch (status) {
    case ENUM_REPORT_STATUS.PENDING: return "#ef4444";
    case ENUM_REPORT_STATUS.IN_PROGRESS: return "#eab308";
    case ENUM_REPORT_STATUS.RESOLVED: return "#22c55e";
    default: return "#6b7280";
  }
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 70,
    paddingBottom: 15,
  },
  markerPin: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -6,
  },
  pending: {
    backgroundColor: "#ef4444",
  },
  inProgress: {
    backgroundColor: "#eab308",
  },
  verified: {
    backgroundColor: "#3b82f6",
  },
  resolved: {
    backgroundColor: "#22c55e",
  },
  default: {
    backgroundColor: "#6b7280",
  },
});

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { PointAnnotation } from "@vietmap/vietmap-gl-react-native";
import { ENUM_REPORT_STATUS, ENUM_REPORT_TYPE } from "@repo/shared";
import {
  Stethoscope,
  Utensils,
  Droplet,
  LifeBuoy,
  CircleHelp,
  Activity
} from "lucide-react-native";

interface MapReportMarkerProps {
  report: any;
  count?: number;
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
      return <Stethoscope size={size} color={color} fill={color} fillOpacity={0.2} />;
    case ENUM_REPORT_TYPE.FOOD:
      return <Utensils size={size} color={color} fill={color} fillOpacity={0.2} />;
    case ENUM_REPORT_TYPE.WATER:
      return <Droplet size={size} color={color} fill={color} fillOpacity={0.2} />;
    case ENUM_REPORT_TYPE.EVACUATION:
      return <LifeBuoy size={size} color={color} />;
    case ENUM_REPORT_TYPE.OTHER:
    default:
      return <CircleHelp size={size} color={color} />;
  }
};

export const MapReportMarker = React.memo(
  ({ report, count = 1, onSelected }: MapReportMarkerProps) => {
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

    const getStatusColor = (status: ENUM_REPORT_STATUS) => {
        switch (status) {
          case ENUM_REPORT_STATUS.PENDING: return "#ef4444";
          case ENUM_REPORT_STATUS.IN_PROGRESS: return "#eab308";
          case ENUM_REPORT_STATUS.RESOLVED: return "#22c55e";
          default: return "#6b7280";
        }
    };

    // Safe coordinate extraction with fallbacks
    const lng = report.location?.coordinates?.[0] ?? report.coordinates?.[0] ?? report.location?.lng;
    const lat = report.location?.coordinates?.[1] ?? report.coordinates?.[1] ?? report.location?.lat;
    
    const isValidCoords = typeof lng === 'number' && typeof lat === 'number';
    const coords: [number, number] = [lng ?? 0, lat ?? 0];

    if (!isValidCoords) return null;

    const mainColor = getStatusColor(report.status);

    return (
      <PointAnnotation
        id={`report-${report._id}`}
        coordinate={coords}
        onSelected={() => onSelected(report)}
      >
        <View style={styles.markerContainer}>
          {/* Main Pin Shape */}
          <View style={[styles.markerPin, { backgroundColor: mainColor, borderColor: 'white' }]}>
             <ReportIcon type={report.type} size={20} color="white" />
          </View>
          
          {/* Count Badge for stacked reports */}
          {count > 1 && (
              <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
              </View>
          )}

          {/* Pin Tip (Triangle) */}
          <View style={[styles.pinTip, { borderTopColor: mainColor }]} />
          
          {/* Shadow (Optional separate view for better separation) */}
          <View style={styles.shadowBase} />
        </View>
      </PointAnnotation>
    );
  },
  (prev, next) => {
    return (
      prev.report._id === next.report._id &&
      prev.report.status === next.report.status &&
      prev.report.type === next.report.type &&
      prev.count === next.count &&
      prev.report.location?.coordinates?.[0] === next.report.location?.coordinates?.[0] &&
      prev.report.location?.coordinates?.[1] === next.report.location?.coordinates?.[1]
    );
  }
);

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: 60,
    height: 70,
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 10, // Adjust relative to markerContainer width
    backgroundColor: '#DC2626', // Red-600
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
    paddingHorizontal: 4
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2, // Slight overlap
    zIndex: 1,
  },
  shadowBase: {
    width: 10,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    marginTop: 2,
  },
  // Status Colors (kept for reference, but used dynamically above)
  pending: { backgroundColor: "#ef4444" },
  inProgress: { backgroundColor: "#eab308" },
  resolved: { backgroundColor: "#22c55e" },
  default: { backgroundColor: "#6b7280" },
});

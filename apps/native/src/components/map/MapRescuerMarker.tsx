import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { PointAnnotation } from "@vietmap/vietmap-gl-react-native";
import { isUserOnline } from "@/utils/date";

interface MapRescuerMarkerProps {
  rescuer: any;
  onSelected: (rescuer: any) => void;
}

import { ShipWheel } from "lucide-react-native";

export const MapRescuerMarker = React.memo(
  ({ rescuer, onSelected }: MapRescuerMarkerProps) => {
    const lng = rescuer.location?.coordinates?.[0] ?? rescuer.coordinates?.[0] ?? rescuer.location?.lng;
    const lat = rescuer.location?.coordinates?.[1] ?? rescuer.coordinates?.[1] ?? rescuer.location?.lat;
    const coords: [number, number] = [lng ?? 0, lat ?? 0];
    
    return (
      <PointAnnotation
        id={`rescuer-${rescuer._id}`}
        coordinate={coords}
        onSelected={() => onSelected(rescuer)}
      >
        <View style={styles.container}>
          <View style={styles.markerContainer}>
            <View style={styles.markerPin}>
               <ShipWheel size={24} color="white" />
            </View>
            <View style={styles.pinTip} />
          </View>
          
          <View style={styles.labelContainer}>
            <View
              style={[
                styles.statusDot,
                isUserOnline(rescuer.lastLocationAt)
                  ? styles.statusOnline
                  : styles.statusOffline,
              ]}
            />
            <Text style={styles.labelText}>{rescuer.firstName}</Text>
          </View>
        </View>
      </PointAnnotation>
    );
  },
  (prev, next) => {
    return (
      prev.rescuer._id === next.rescuer._id &&
      prev.rescuer.location?.lat === next.rescuer.location?.lat &&
      prev.rescuer.location?.lng === next.rescuer.location?.lng &&
      prev.rescuer.lastLocationAt === next.rescuer.lastLocationAt
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    height: 60,
  },
  markerPin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6", // blue-500
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
  pinTip: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#3b82f6',
    marginTop: -5,
  },
  labelContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: "#22c55e", // green-500
  },
  statusOffline: {
    backgroundColor: "#9ca3af", // gray-400
  },
  labelText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1d4ed8", // blue-700
  },
});

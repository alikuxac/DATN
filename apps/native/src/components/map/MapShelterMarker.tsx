import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { PointAnnotation } from "@vietmap/vietmap-gl-react-native";
import { Warehouse, Heart } from "lucide-react-native"; // Warehouse icon for shelters
import { useColors } from "@/hooks/useColors";

interface MapShelterMarkerProps {
  id: string;
  coordinate: number[]; // [lng, lat]
  title: string;
  type: string;
  status: string;
  onPress: () => void;
}

export const MapShelterMarker: React.FC<MapShelterMarkerProps> = ({
  id,
  coordinate,
  title,
  type,
  status,
  onPress,
}) => {
  const colors = useColors();

  const getMarkerColor = () => {
    switch (status) {
      case "ACTIVE":
        return "#10B981"; // green-500
      case "FULL":
        return "#EF4444"; // red-500
      case "CLOSED":
        return "#6B7280"; // gray-500
      default:
        return "#F59E0B"; // amber-500
    }
  };

  const getIcon = () => {
    if (type === "MEDICAL") {
        return <Heart size={16} color="white" fill="white" />;
    }
    return <Warehouse size={16} color="white" />;
  }

  return (
    <PointAnnotation
      id={`shelter-${id}`}
      coordinate={coordinate}
      onSelected={onPress}
    >
      <View
        style={[
            styles.container, 
            { backgroundColor: getMarkerColor(), borderColor: colors.background }
        ]}
      >
        {getIcon()}
      </View>
      
      {/* Callout is tricky in VietMap GL specific versions, often better to rely on onSelected + Sheet */}
    </PointAnnotation>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

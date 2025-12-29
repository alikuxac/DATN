import React from "react";
import { View } from "react-native";
import { PointAnnotation } from "@vietmap/vietmap-gl-react-native";
import { AppText, Icon } from "@/components/ui";

interface MapRescuerMarkerProps {
  rescuer: any;
  onSelected: (rescuer: any) => void;
}

export const MapRescuerMarker = ({ rescuer, onSelected }: MapRescuerMarkerProps) => {
  return (
    <PointAnnotation
      id={`rescuer-${rescuer._id}`}
      coordinate={
        rescuer.coordinates || [rescuer.location.lng, rescuer.location.lat]
      }
      onSelected={() => onSelected(rescuer)}
    >
      <View className="items-center">
        <View className="bg-white p-1 rounded-full border-2 border-blue-500 shadow-sm mb-1">
          <Icon name="Ambulance" size={20} color="#3b82f6" />
        </View>
        <View className="bg-white/90 px-2 py-0.5 rounded shadow-sm">
          <AppText className="text-[10px] font-bold text-blue-700">
            {rescuer.firstName}
          </AppText>
        </View>
      </View>
    </PointAnnotation>
  );
};

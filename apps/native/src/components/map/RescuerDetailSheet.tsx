import React from "react";
import { View } from "react-native";
import { AppText, AppButton, Avatar } from "@/components/ui";
import { Phone } from "lucide-react-native";
import { formatTimeAgo, isUserOnline } from "@/utils/date";

interface RescuerDetailSheetProps {
  selectedRescuer: any;
  onClose: () => void;
  handleCall: (phone?: string) => void;
}

export const RescuerDetailSheet = ({
  selectedRescuer,
  onClose,
  handleCall,
}: RescuerDetailSheetProps) => {
  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutrals900 p-5 rounded-t-3xl shadow-2xl z-50">
      <View className="items-center">
        <Avatar
          size="xl"
          text={selectedRescuer.firstName}
          className="mb-3 border-4 border-white shadow-sm"
        />
        <AppText variant="heading3" className="font-bold">
          {selectedRescuer.firstName} {selectedRescuer.lastName}
        </AppText>
        <View className="bg-blue-100 px-3 py-1 rounded-full mt-2 mb-2">
          <AppText className="text-blue-700 font-bold text-xs uppercase">
            Đội cứu hộ tình nguyện
          </AppText>
        </View>

        <View className="flex-row items-center gap-1.5 mb-4">
          <View 
            className={`w-2 h-2 rounded-full ${
              isUserOnline(selectedRescuer.lastLocationAt) ? 'bg-green-500' : 'bg-gray-400'
            }`} 
          />
          <AppText className="text-xs text-gray-500">
            {isUserOnline(selectedRescuer.lastLocationAt) 
              ? 'Đang hoạt động' 
              : `Hoạt động ${formatTimeAgo(selectedRescuer.lastLocationAt)}`}
          </AppText>
        </View>

        <View className="flex-row gap-4 w-full px-4">
          <AppButton
            className="flex-1 bg-green-500 rounded-xl"
            onPress={() => handleCall(selectedRescuer.phone)}
          >
            <View className="flex-row items-center gap-2">
              <Phone size={18} color="white" />
              <AppText className="text-white font-bold">Gọi điện</AppText>
            </View>
          </AppButton>
          <AppButton
            variant="outline"
            className="flex-1 rounded-xl"
            onPress={onClose}
          >
            Đóng
          </AppButton>
        </View>
      </View>
    </View>
  );
};

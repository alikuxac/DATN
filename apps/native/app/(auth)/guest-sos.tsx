import React, { useState, useEffect } from "react";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { View, ScrollView, Alert, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { ENUM_REPORT_TYPE, ENUM_REPORT_SEVERITY } from "@repo/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "@/services/api.service";
import * as Application from 'expo-application';
import { AppButton, AppInput, AppText } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { useColors } from "@/hooks/useColors";
import AuthHeaderActions from "@/components/auth/AuthHeaderActions";
import { Utensils, Droplet, Stethoscope, LifeBuoy, CircleHelp } from "lucide-react-native";
import { getRegionFromGeoJSON } from "@/utils/geo";

const REPORT_TYPES = [
  { label: "Cần sơ tán", value: ENUM_REPORT_TYPE.EVACUATION, icon: LifeBuoy },
  { label: "Cần y tế", value: ENUM_REPORT_TYPE.MEDICAL, icon: Stethoscope },
  { label: "Thực phẩm", value: ENUM_REPORT_TYPE.FOOD, icon: Utensils },
  { label: "Nước uống", value: ENUM_REPORT_TYPE.WATER, icon: Droplet },
  { label: "Khác", value: ENUM_REPORT_TYPE.OTHER, icon: CircleHelp },
];

import { useLocationContext } from "@/context/LocationContext";

export default function GuestSOS() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { userLocation, currentRegion } = useLocationContext();
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  
  // From State
  const [type, setType] = useState<ENUM_REPORT_TYPE>(ENUM_REPORT_TYPE.EVACUATION);
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ phone?: string }>({});

  useEffect(() => {
    (async () => {
      let id = Platform.OS === 'android' ? Application.getAndroidId() : await Application.getIosIdForVendorAsync();
      setDeviceId(id || "unknown-device");
    })();
  }, []);

  const validate = () => {
      if (!phone.trim()) {
          setErrors({ phone: "Vui lòng nhập số điện thoại" });
          return false;
      }
      return true;
  }

  const onSubmit = async () => {
    if (!validate()) return;
    if (!userLocation) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại. Vui lòng thử lại.");
      return;
    }

    setLoading(true);
    try {
      await apiService.post("/public/report/guest", {
        type,
        notes,
        phone,
        coordinates: [userLocation.longitude, userLocation.latitude],
        severity: ENUM_REPORT_SEVERITY.HIGH, // Default strict high severity for SOS
        regionId: currentRegion, // Default or detect region
        deviceId: deviceId, // Ensure device Id is sent in body too
      }, {
        headers: {
            'x-device-id': deviceId
        }
      });
      Alert.alert("Thành công", "Yêu cầu cứu hộ đã được gửi! Hãy giữ bình tĩnh, chúng tôi đang tới.", [
        { text: "OK", onPress: () => router.replace("/(auth)/sign-in") }
      ]);
    } catch (error: any) {
        console.error("Guest report error:", error);
        const message = error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
        if (message === 'report.error.rateLimitExceeded') {
             Alert.alert("Lỗi", "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi.");
        } else {
             Alert.alert("Lỗi", "Không thể gửi báo cáo. " + message);
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutrals900 relative">
      {/* Decorative Background Elements */}
      <View className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-red-500/10 rounded-full blur-3xl z-[-1]" />
      <View className="absolute bottom-[-50px] left-[-50px] w-80 h-80 bg-orange-500/10 rounded-full blur-3xl z-[-1]" />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Header Actions for Theme Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
          <View className="items-end mb-2">
              <AuthHeaderActions />
          </View>

          <AppText raw className="text-3xl font-bold text-red-600 dark:text-red-500 text-center mb-2">
              SOS KHẨN CẤP
          </AppText>
          <AppText raw className="text-base text-neutrals400 dark:text-neutrals400 text-center mb-3 font-sans-medium">
              Báo cáo khẩn cấp không cần đăng nhập
          </AppText>
          
          <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-6 border border-red-100 dark:border-red-900/50">
              <AppText raw className="text-sm text-red-600 dark:text-red-400 italic text-center">
                  Lưu ý: Chỉ sử dụng trong trường hợp thực sự khẩn cấp. Lạm dụng sẽ bị chặn thiết bị.
              </AppText>
          </View>
        </Animated.View>


        <Animated.View entering={FadeInUp.delay(500).duration(1000).springify()}>
          <View className="mb-6">
              <AppText raw className="text-base font-bold mb-3 ml-1 text-foreground">
                Loại hỗ trợ cần thiết:
              </AppText>
              <View className="flex-row flex-wrap justify-between">
                {REPORT_TYPES.map((t, index) => {
                  const isSelected = type === t.value;
                  const IconComp = t.icon;
                  // Last item (Other) spans full width if odd count, but with 5 items, index 4 is last.
                  // 0, 1 (row 1)
                  // 2, 3 (row 2)
                  // 4 (row 3) -> Full width looks good.
                  const isFullWidth = index === REPORT_TYPES.length - 1;

                  return (
                    <TouchableOpacity
                      key={t.value}
                      className={`mb-3 rounded-xl p-4 border flex-row items-center justify-center gap-3 shadow-sm ${
                          isFullWidth ? "w-full" : "w-[48%]"
                      } ${
                          isSelected 
                          ? "bg-red-600 border-red-600 dark:bg-red-600 dark:border-red-600" 
                          : "bg-white dark:bg-neutrals800 border-gray-200 dark:border-neutrals700"
                      }`}
                      onPress={() => setType(t.value)}
                    >
                      <IconComp size={20} color={isSelected ? "white" : "#DC2626"} />
                      <AppText raw className={`text-sm font-bold ${
                          isSelected ? "text-white" : "text-gray-700 dark:text-gray-200"
                      }`}>
                          {t.label}
                      </AppText>
                    </TouchableOpacity>
                  )})}
              </View>
          </View>

          <AppInput
              label="Số điện thoại liên hệ *"
              placeholder="Nhập số điện thoại của bạn"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              errorText={errors.phone}
              containerClassName="mb-4"
              labelClassName="font-sans-bold"
          />

          <AppInput
              label="Ghi chú thêm"
              placeholder="Mô tả tình trạng, số lượng người gặp nạn..."
              value={notes}
              onChangeText={setNotes}
              variant="textarea"
              numberOfLines={3}
              containerClassName="mb-4"
              labelClassName="font-sans-bold"
          />

          {userLocation && (
              <AppText className="text-center mb-6 text-green-600 dark:text-green-400 font-sans-medium">
                  Vị trí của bạn: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </AppText>
          )}

          <AppButton
            onPress={onSubmit}
            loading={loading}
            disabled={!userLocation}
            className="w-full bg-red-600 dark:bg-red-700 rounded-full py-4 shadow-lg"
            textClassname="text-white font-bold text-lg"
          >
              GỬI YÊU CẦU CỨU HỘ
          </AppButton>
          
          <AppButton
              variant="ghost"
              onPress={() => router.back()}
              className="mt-4"
              textClassname="text-neutrals600 dark:text-neutrals400 font-sans-medium"
          >
              Quay lại Đăng nhập
          </AppButton>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

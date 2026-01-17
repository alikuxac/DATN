import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { ENUM_REPORT_TYPE, ENUM_REPORT_SEVERITY } from "@repo/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "@/services/api.service";
import * as Application from 'expo-application';
import { AppButton, AppInput, AppText } from "@/components/ui";

// Mock report types if not available from shared (or ensure shared is correct)
const REPORT_TYPES = [
  { label: "Cần thực phẩm", value: ENUM_REPORT_TYPE.FOOD },
  { label: "Cần nước uống", value: ENUM_REPORT_TYPE.WATER },
  { label: "Cần y tế", value: ENUM_REPORT_TYPE.MEDICAL },
  { label: "Cần sơ tán", value: ENUM_REPORT_TYPE.EVACUATION },
  { label: "Khác", value: ENUM_REPORT_TYPE.OTHER },
];

export default function GuestSOS() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  
  // From State
  const [type, setType] = useState<ENUM_REPORT_TYPE>(ENUM_REPORT_TYPE.EVACUATION);
  const [notes, setNotes] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ phone?: string }>({});

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền truy cập vị trí bị từ chối", "Chúng tôi cần vị trí của bạn để gửi cứu hộ.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

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
    if (!location) {
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại. Vui lòng thử lại.");
      return;
    }

    setLoading(true);
    try {
      await apiService.post("/public/report/guest", {
        type,
        notes,
        phone,
        coordinates: [location.coords.longitude, location.coords.latitude],
        severity: ENUM_REPORT_SEVERITY.HIGH, // Default strict high severity for SOS
        regionId: "VN", // Default or detect region
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>SOS KHẨN CẤP</Text>
        <Text style={styles.subHeader}>Báo cáo khẩn cấp không cần đăng nhập</Text>
        <Text style={styles.warning}>Lưu ý: Chỉ sử dụng trong trường hợp thực sự khẩn cấp. Lạm dụng sẽ bị chặn thiết bị.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Loại hỗ trợ cần thiết:</Text>
          <View style={styles.typeContainer}>
            {REPORT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeButton, type === t.value && styles.selectedTypeButton]}
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.typeButtonText, type === t.value && styles.selectedTypeButtonText]}>
                    {t.label}
                </Text>
              </TouchableOpacity>
            ))}
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
        />

        <AppInput
            label="Ghi chú thêm"
            placeholder="Mô tả tình trạng, số lượng người gặp nạn..."
            value={notes}
            onChangeText={setNotes}
            variant="textarea"
            numberOfLines={3}
            containerClassName="mb-4"
        />

        {location && (
            <Text style={styles.locationText}>
                Vị trí của bạn: {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
            </Text>
        )}

        <AppButton
          onPress={onSubmit}
          loading={loading}
          disabled={!location}
          className="w-full bg-red-600 rounded-lg py-4"
          textClassname="text-white font-bold text-lg"
        >
            GỬI YÊU CẦU CỨU HỘ
        </AppButton>
        
        <AppButton
            variant="ghost"
            onPress={() => router.back()}
            className="mt-4"
        >
            Quay lại Đăng nhập
        </AppButton>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#D32F2F", // Red color for emergency
    textAlign: "center",
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },
  warning: {
    fontSize: 14,
    color: "#D32F2F",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 5,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginLeft: 10,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    marginBottom: 10,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D32F2F",
    backgroundColor: 'transparent'
  },
  selectedTypeButton: {
    backgroundColor: "#D32F2F",
    borderColor: "#D32F2F",
  },
  typeButtonText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: '600'
  },
  selectedTypeButtonText: {
    color: "#fff",
  },
  locationText: {
      textAlign: 'center',
      marginBottom: 20,
      color: 'green'
  }
});

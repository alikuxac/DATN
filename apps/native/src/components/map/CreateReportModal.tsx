import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  X,
  Utensils, // Food
  Droplets, // Water
  Stethoscope, // Medical
  LifeBuoy, // Evacuation
  Minus, 
  Plus as PlusIcon
} from "lucide-react-native";
import { useToast } from "@/components/ui/ToastProvider";
import { apiService } from "@/services/api.service";
import { ENUM_REPORT_SEVERITY, ENUM_REPORT_TYPE } from "@repo/shared";
import { getRegionFromGeoJSON } from "@/utils/geo";
import { offlineService } from "@/services/OfflineService";

interface Props {
  visible: boolean;
  onClose: () => void;
  location: { lat: number; long: number } | null;
  onSuccess?: () => void;
  onPickLocation?: () => void;
}

// Cấu hình hiển thị (Label + Màu + Icon)
export const REPORT_TYPES_CONFIG = {
  [ENUM_REPORT_TYPE.FOOD]: {
    label: "Lương thực",
    icon: Utensils,
    color: "#EA580C",
    bgColor: "#FFEDD5",
  },
  [ENUM_REPORT_TYPE.WATER]: {
    label: "Nước uống",
    icon: Droplets,
    color: "#2563EB",
    bgColor: "#DBEAFE",
  },
  [ENUM_REPORT_TYPE.MEDICAL]: {
    label: "Y tế / Thuốc",
    icon: Stethoscope,
    color: "#16A34A",
    bgColor: "#DCFCE7",
  },
  [ENUM_REPORT_TYPE.EVACUATION]: {
    label: "Cần sơ tán",
    icon: LifeBuoy,
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
};

const SEVERITY_CONFIG = [
  {
    id: ENUM_REPORT_SEVERITY.LOW,
    label: "Thấp",
    color: "bg-gray-200 text-gray-600",
  },
  {
    id: ENUM_REPORT_SEVERITY.MEDIUM,
    label: "Vừa",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: ENUM_REPORT_SEVERITY.HIGH,
    label: "Cao",
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: ENUM_REPORT_SEVERITY.CRITICAL,
    label: "Khẩn cấp",
    color: "bg-red-100 text-red-700 font-bold",
  },
];

export const CreateReportModal = ({
  visible,
  onClose,
  location,
  onSuccess,
  onPickLocation,
}: Props) => {
  const [type, setType] = useState<ENUM_REPORT_TYPE>(ENUM_REPORT_TYPE.FOOD);
  const [severity, setSeverity] = useState<ENUM_REPORT_SEVERITY>(
    ENUM_REPORT_SEVERITY.MEDIUM
  );
  const [peopleCount, setPeopleCount] = useState(1);
  const [description, setDescription] = useState("");
  
  // Proxy State
  const [isProxy, setIsProxy] = useState(false);
  const [victimName, setVictimName] = useState("");
  const [victimCount, setVictimCount] = useState(1);
  const [victimNote, setVictimNote] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();



  const handleSubmit = async () => {
    if (!location) return;
    if (!description.trim() && !isProxy) { 
      showToast({ title: "Chưa nhập mô tả", message: "Vui lòng nhập mô tả nhu cầu", type: "warning" });
      return;
    }

    if (isProxy && !victimName.trim()) {
         showToast({ title: "Thiếu thông tin", message: "Vui lòng nhập tên người cần giúp", type: "warning" });
         return;
    }

    const regionId = getRegionFromGeoJSON(location.lat, location.long);
    
    const payload: any = {
        coordinates: [location.long, location.lat], // [longitude, latitude]
        type,
        notes: description.trim(),
        regionId,
        severity,
        peopleCount: isProxy ? victimCount : peopleCount,
        isProxyReport: isProxy,
    };

    if (isProxy) {
        payload.proxyData = {
            victimName,
            victimCount,
            victimNote
        };
    }

    try {
      setLoading(true);

      // Sử dụng OfflineService để handle mất mạng
      await offlineService.attemptAction(
          () => apiService.post('/user/report', payload),
          {
              method: 'POST',
              endpoint: '/user/report',
              data: payload
          }
      );

      showToast({ title: "Gửi yêu cầu thành công!", message: "Yêu cầu của bạn đã được gửi đi", type: "success" });
      setDescription("");
      setType(ENUM_REPORT_TYPE.FOOD);
      setIsProxy(false);
      setVictimName("");
      setVictimNote("");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      if (error.message === 'OFFLINE_SAVED') {
          showToast({ title: "Đã lưu Offline", message: "Hệ thống sẽ tự động gửi khi có mạng", type: "info" });
          setDescription("");
          setType(ENUM_REPORT_TYPE.FOOD);
          setIsProxy(false);
          setVictimName("");
          setVictimNote("");
          onSuccess?.();
          onClose();
      } else {
          console.log("Create report error:", error);
          showToast({ title: "Gửi thất bại", message: "Đã có lỗi xảy ra, vui lòng thử lại", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-white rounded-t-3xl h-[85%] flex flex-col">
          {/* Header Fixed */}
          <View className="p-6 border-b border-gray-100 flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-gray-900">
                Gửi Yêu Cầu Hỗ Trợ
              </Text>
              <Text className="text-sm text-gray-500">
                Thông tin chính xác giúp cứu hộ nhanh hơn
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-gray-100 rounded-full"
            >
              <X size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Body Scrollable */}
          <ScrollView
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false}
          >
             {/* --- PROXY TOGGLE --- */}
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setIsProxy(!isProxy)}
                className={`flex-row items-center justify-between p-4 rounded-xl border mb-6 ${isProxy ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}
            >
                <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isProxy ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                         <Text className="text-white font-bold">{isProxy ? 'HO' : 'ME'}</Text> 
                    </View>
                    <View>
                        <Text className={`font-bold text-base ${isProxy ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {isProxy ? 'Báo hộ người khác' : 'Báo cho chính tôi'}
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {isProxy ? 'Dùng khi nạn nhân không thể tự báo' : 'Dùng khi bạn gặp nạn'}
                        </Text>
                    </View>
                </View>
                 {/* Switch Visual */}
                <View className={`w-12 h-6 rounded-full ${isProxy ? 'bg-indigo-500' : 'bg-gray-300'} justify-center px-1`}>
                    <View className={`w-4 h-4 bg-white rounded-full shadow ${isProxy ? 'self-end' : 'self-start'}`} />
                </View>
            </TouchableOpacity>

            {/* --- PROXY FIELDS --- */}
            {isProxy && (
                <View className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                     <Text className="text-xs font-bold text-indigo-500 mb-3 uppercase tracking-wider">
                        Thông tin nạn nhân
                    </Text>
                    
                    <View className="mb-3">
                        <Text className="text-sm font-medium text-gray-700 mb-1">Tên nạn nhân / Nhóm *</Text>
                        <TextInput 
                            className="bg-white border border-gray-200 rounded-lg p-3 text-gray-800"
                            placeholder="VD: Cụ Ba, Nhóm trẻ em..."
                            value={victimName}
                            onChangeText={setVictimName}
                        />
                    </View>
                     
                    <View className="mb-3">
                         <Text className="text-sm font-medium text-gray-700 mb-1">Ghi chú về nạn nhân</Text>
                         <TextInput 
                            className="bg-white border border-gray-200 rounded-lg p-3 text-gray-800"
                            placeholder="VD: Người già yếu, không có điện thoại..."
                            value={victimNote}
                            onChangeText={setVictimNote}
                        />
                    </View>

                    {/* LOCATION PICKER BUTTON */}
                    <TouchableOpacity 
                        onPress={() => {
                            if (onPickLocation) {
                                onClose(); // Close modal temporarily
                                onPickLocation(); // Trigger map pickup mode
                            } else {
                                showToast({ title: 'Info', message: "Chức năng chọn vị trí chưa sẵn sàng", type: 'info'});
                            }
                        }}
                        className="flex-row items-center justify-center bg-white border border-indigo-300 p-3 rounded-lg border-dashed"
                    >
                        <View className="mr-2"><PlusIcon size={16} color="#4F46E5" /></View>
                        <Text className="text-indigo-600 font-bold">Chỉnh sửa vị trí trên bản đồ</Text>
                    </TouchableOpacity>
                     {location && (
                        <Text className="text-center text-xs text-indigo-400 mt-2">
                            Đang chọn: {location.lat.toFixed(5)}, {location.long.toFixed(5)}
                        </Text>
                    )}
                </View>
            )}

            {/* 1. Chọn Loại Report */}
            <Text className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Loại hỗ trợ
            </Text>
            <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
              {Object.entries(REPORT_TYPES_CONFIG).map(([key, config]) => {
                const itemKey = key as ENUM_REPORT_TYPE;
                const isSelected = type === itemKey;
                return (
                  <TouchableOpacity
                    key={itemKey}
                    onPress={() => setType(itemKey)}
                    className={`w-[48%] flex-row items-center p-3 rounded-xl border ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <View className="p-2 rounded-full bg-white mr-2 shadow-sm">
                      <config.icon size={20} color={config.color} />
                    </View>
                    <Text
                      className={`font-medium text-xs ${isSelected ? "text-primary" : "text-gray-700"}`}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Row: Mức độ & Số người */}
            <View className="flex-row justify-between mb-6">
              {/* Cột Trái: Số người */}
              <View className="w-[45%]">
                  <Text className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                    {isProxy ? 'Số nạn nhân' : 'Số người cần giúp'}
                  </Text>
                  <View className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-2">
                    <TouchableOpacity
                      onPress={() => isProxy ? setVictimCount(Math.max(1, victimCount - 1)) : setPeopleCount(Math.max(1, peopleCount - 1))}
                      className="w-10 h-10 bg-white rounded-lg items-center justify-center shadow-sm"
                    >
                      <Minus size={20} color="#666" />
                    </TouchableOpacity>
  
                    <Text className="text-xl font-bold text-gray-800">
                      {isProxy ? victimCount : peopleCount}
                    </Text>
  
                    <TouchableOpacity
                      onPress={() => isProxy ? setVictimCount(Math.min(100, victimCount + 1)) : setPeopleCount(Math.min(100, peopleCount + 1))}
                      className="w-10 h-10 bg-primary rounded-lg items-center justify-center shadow-sm"
                    >
                      <PlusIcon size={20} color="white" />
                    </TouchableOpacity>
                </View>
              </View>

              {/* Cột Phải: Mức độ */}
              <View className="w-[50%]">
                <Text className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                  Mức độ khẩn cấp
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SEVERITY_CONFIG.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSeverity(item.id)}
                      className={`px-3 py-2 rounded-lg border ${
                        severity === item.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white"
                      } mb-1 grow items-center`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          severity === item.id
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* 3. Nhập mô tả */}
            <Text className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Chi tiết tình hình
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] text-base text-gray-800 mb-8"
              placeholder="VD: Nước ngập sâu 1m, có người già yếu, đã hết lương thực 2 ngày..."
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </ScrollView>

          {/* Footer Button Fixed */}
          <View className="p-6 border-t border-gray-100 bg-white">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`py-4 rounded-xl flex-row justify-center items-center ${
                loading ? "bg-gray-300" : "bg-primary"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {isProxy ? 'Gửi Báo Cáo Hộ' : 'Gửi Báo Cáo Ngay'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

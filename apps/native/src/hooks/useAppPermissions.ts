import { useState, useEffect, useCallback } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

// Định nghĩa trạng thái quyền
export interface PermissionStatus {
  location: boolean;
  notification: boolean;
  loading: boolean;
}

export const useAppPermissions = () => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    location: false,
    notification: false,
    loading: true,
  });

  // Hàm kiểm tra tất cả quyền hiện tại
  const checkPermissions = useCallback(async () => {
    try {
      const [loc, noti] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);

      setPermissions({
        location: loc.status === "granted",
        notification: noti.status === "granted",
        loading: false,
      });
    } catch (error) {
      console.error("Error checking permissions:", error);
      setPermissions((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Check quyền khi app focus trở lại (trường hợp user vào Setting bật quyền rồi quay lại)
  useEffect(() => {
    checkPermissions();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissions();
      }
    });
    return () => subscription.remove();
  }, [checkPermissions]);

  // --- CÁC HÀM XIN QUYỀN RIÊNG LẺ ---

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") checkPermissions();
    return status === "granted";
  };

  const requestNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") checkPermissions();
    return status === "granted";
  };


  // Hàm mở Setting của điện thoại nếu user lỡ từ chối vĩnh viễn
  const openSettings = () => {
    Linking.openSettings();
  };

  return {
    permissions,
    requestLocation,
    requestNotification,
    openSettings,
    checkPermissions, // Expose hàm này để gọi thủ công nếu cần
  };
};
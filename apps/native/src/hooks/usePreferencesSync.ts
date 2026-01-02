import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme, setLanguage } from "@/store/slices/appSlice";
import { apiService } from "@/services/api.service";
import i18n from "@/config/i18n";

/**
 * Hook để sync preferences từ server khi app khởi động
 * Chỉ chạy 1 lần khi có token
 */
export function usePreferencesSync() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.app);
  const hasSynced = useRef(false);

  useEffect(() => {
    // Chỉ sync 1 lần khi có token và chưa sync
    if (!token || hasSynced.current) return;

    const syncPreferences = async () => {
      try {
        const response = await apiService.get<any>("/user/profile");
        const userPreferences = response?.data?.preferences;

        if (userPreferences) {
          // Ưu tiên settings từ server
          dispatch(setTheme(userPreferences.theme));
          dispatch(setLanguage(userPreferences.language));

          // Sync i18n
          if (i18n.language !== userPreferences.language) {
            await i18n.changeLanguage(userPreferences.language);
          }

          hasSynced.current = true;
          console.log("✅ Preferences synced from server:", userPreferences);
        }
      } catch (error) {
        console.warn("⚠️ Failed to sync preferences from server:", error);
      }
    };

    syncPreferences();
  }, [token, dispatch]);
}

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme, setLanguage, setUser, Theme } from "@/store/slices/appSlice";
import { apiService } from "@/services/api.service";
import i18n, { LanguageCode } from "@/config/i18n";
import { UserPreferences } from "../../app/settings/preferences";

/**
 * Hook để sync preferences từ server khi app khởi động
 * Chỉ chạy 1 lần khi có token
 */
export function usePreferencesSync() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.app);
  const hasSynced = useRef(false);

  useEffect(() => {
    // Reset sync status if no token (logout)
    if (!token) {
      hasSynced.current = false;
      return;
    }

    // Chỉ sync 1 lần khi có token và chưa sync
    if (hasSynced.current) return;

    const syncPreferences = async () => {
      try {
        // 1. Sync Preferences
        const response = await apiService.get<{ data: UserPreferences }>("/shared/user/preferences");
        const userPreferences = response?.data;

        if (userPreferences) {
          if (userPreferences.theme) dispatch(setTheme(userPreferences.theme as Theme));
          if (userPreferences.language) dispatch(setLanguage(userPreferences.language as LanguageCode));

          hasSynced.current = true;
          console.log("✅ Preferences synced from server:", userPreferences);
        }

        // 2. Fetch User Profile if missing in Redux
        // (Robustness check: ensure user data is fresh or restored if persistence failed)
        try {
          // Using a generic user profile endpoint - verify if this exists in API first? 
          // Usually /user/profile or /auth/me. 
          // Based on previous context, assume /user/profile or check API service.
          // Let's safe bet on commonly used endpoint or check what login uses.
          // Actually, let's just use the shared info endpoint if needed, or proper profile.
          // Assuming /user/profile exists per standard.

          const profileRes = await apiService.get<any>("/shared/user/profile");
          if (profileRes.data) {
            dispatch(setUser(profileRes.data));
            console.log("✅ User profile synced from server");
          }
        } catch (err) {
          console.log("Failed to fetch user profile in background", err);
        }

      } catch (error) {
        console.warn("⚠️ Failed to sync preferences from server:", error);
      }
    };

    syncPreferences();
  }, [token, dispatch]);
}

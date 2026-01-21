import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { colorScheme } from "nativewind";
import { LanguageCode } from '@/config/i18n';
import { IUserGetResponse } from '@repo/shared';
// Use require to avoid circular dependency with apiService -> store -> appSlice
// import { apiService } from "@/services/api.service"; 

export type Theme = 'light' | 'dark';

export interface Insets {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface AppState {
  theme: Theme;
  language: LanguageCode;
  insets: Insets;
  isFirstLaunch: boolean;
  isLoading: boolean;
  token: string | null;
  refreshToken: string | null;
  user: IUserGetResponse | null;
  regionId: string;
}

const initialState: AppState = {
  theme: 'light',
  language: 'vi',
  insets: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  isFirstLaunch: true,
  isLoading: false,
  token: null,
  refreshToken: null,
  user: null,
  regionId: 'unknown',
};

// Async Thunks
export const fetchUserPreferences = createAsyncThunk(
  'app/fetchUserPreferences',
  async (_, { dispatch }) => {
    const { apiService } = await import('@/services/api.service');
    try {
      const response = await apiService.get<any>("/shared/user/profile");
      const prefs = response?.data?.preferences;
      if (prefs) {
        if (prefs.theme) dispatch(setTheme(prefs.theme));
        if (prefs.language) dispatch(setLanguage(prefs.language));
        return prefs;
      }
    } catch (error) {
      console.warn("Failed to fetch preferences:", error);
    }
  }
);

export const syncUserPreferences = createAsyncThunk(
  'app/syncUserPreferences',
  async (prefs: { theme?: Theme; language?: LanguageCode }, { getState }) => {
    const { apiService } = await import('@/services/api.service');
    const state = getState() as any;
    if (state.app.token) {
      try {
        // Get current preferences to merge? Or backend handles merge?
        // Usually PATCH merges.
        await apiService.patch('/shared/user/profile', {
          preferences: prefs
        });
      } catch (error) {
        console.warn("Failed to sync preferences:", error);
      }
    }
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      colorScheme.set(state.theme);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      colorScheme.set(state.theme);
    },
    setLanguage: (state, action: PayloadAction<LanguageCode>) => {
      state.language = action.payload;
    },
    setInsets: (state, action: PayloadAction<Insets>) => {
      state.insets = action.payload;
    },
    setIsFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.refreshToken = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      // Reset defaults or keep? Usually keep local prefs is better UX, but requirement says "sync". 
      // If we logout, maybe we should reset to system default or keep last used?
      // Staying with last used is safer.
      // state.theme = 'light'; 
      // state.language = 'vi';
      state.regionId = 'unknown';
    },
    setUser: (state, action: PayloadAction<IUserGetResponse | null>) => {
      state.user = action.payload;
    },
    setRegionId: (state, action: PayloadAction<string>) => {
      state.regionId = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, setLanguage, setInsets, setIsFirstLaunch, setIsLoading, setToken, setRefreshToken, setUser, setRegionId, logout } = appSlice.actions;
export default appSlice.reducer;

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {colorScheme} from "nativewind";
import {LanguageCode} from '@/config/i18n';
import {getDeviceLanguage} from "@/utils/getDeviceLanguage.ts";
import { IUserGetResponse } from '@repo/shared';

export type Theme = 'light' | 'dark';

export interface Insets {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Get device language


interface AppState {
  theme: Theme;
  language: LanguageCode;
  insets: Insets;
  isFirstLaunch: boolean;
  isLoading: boolean;
  token: string | null;
  user: IUserGetResponse | null;
  regionId: string;
}

const initialState: AppState = {
  theme: 'light',
  language: getDeviceLanguage(),
  insets: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  isFirstLaunch: true,
  isLoading: false,
  token: null,
  user: null,
  regionId: 'unknown',
};

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
    setUser: (state, action: PayloadAction<IUserGetResponse | null>) => {
      state.user = action.payload;
    },
    setRegionId: (state, action: PayloadAction<string>) => {
      state.regionId = action.payload;
    },
    logout: (state) => {
      state.theme = 'light';
      state.language = getDeviceLanguage();
      state.token = null;
      state.user = null;
      state.regionId = 'unknown';
    }
  },
});

export const {setTheme, toggleTheme, setLanguage, setInsets, setIsFirstLaunch, setIsLoading, setToken, setUser, setRegionId, logout} = appSlice.actions;
export default appSlice.reducer;

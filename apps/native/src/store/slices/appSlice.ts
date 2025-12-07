import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {colorScheme} from "nativewind";
import {LanguageCode} from '@/config/i18n';
import {getDeviceLanguage} from "@/utils/getDeviceLanguage.ts";

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
}

const initialState: AppState = {
  theme: 'dark',
  language: getDeviceLanguage(),
  insets: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  isFirstLaunch: true,
  isLoading: false,
  token: null
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
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
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      colorScheme.set(newTheme);
      state.theme = newTheme;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
  },
});

export const {setTheme, setLanguage, setInsets, setIsFirstLaunch, setIsLoading, toggleTheme, setToken} = appSlice.actions;
export default appSlice.reducer;

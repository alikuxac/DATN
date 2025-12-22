import {AppColors, AppColorsLight} from "../config/colors.ts";
import {useAppSelector} from "@/store/hooks.ts";
import { useColorScheme } from "react-native";

export function useColors() {
  const {theme} = useAppSelector(state => state.app);
  const deviceTheme = useColorScheme();
  if (deviceTheme === 'unspecified') {
    return AppColorsLight; // Light theme by default
  }
  if (theme === 'system') return deviceTheme === 'dark' ? AppColorsLight : AppColors;
  if (theme === 'light') return AppColorsLight;
  return AppColors;
}

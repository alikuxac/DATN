import React, { useState } from "react";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { View, Pressable, Platform, Image } from "react-native";
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ApiError, apiService } from "@/services/api.service";

// Components
import AuthContainer from "@/components/auth/AuthContainer";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui";

// Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLanguage, setTheme, setToken, setRefreshToken, setIsFirstLaunch, fetchUserPreferences } from "@/store/slices/appSlice";
import { useToast } from "@/components/ui/ToastProvider";

import AuthHeader from "@/components/auth/header";
import { ENUM_STATUS_CODE_ERROR } from "@repo/shared";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme } = useAppSelector((state) => state.app);
  const { showError, showSuccess } = useToast();
  const colors = useColors();

  // State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    { email: '', password: '' }
  );

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email)
      newErrors.email = t("VALIDATION.REQUIRED", { field: "Email" });
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = t("VALIDATION.EMAIL_INVALID") || "Invalid email";

    if (!password)
      newErrors.password = t("VALIDATION.REQUIRED", { field: "Password" });
    else if (password.length < 6)
      newErrors.password =
        t("VALIDATION.PASSWORD_MIN_LENGTH");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;

    setLoading(true);

    // Reset lỗi cũ trước khi gọi API
    setErrors({});

    try {
      
      // Get Device Info
      let deviceId = 'unknown-device-id';
      const deviceName = Device.modelName || Device.designName || `${Platform.OS.toUpperCase()} Device`;

      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId() || deviceId;
      } else if (Platform.OS === 'ios') {
        const iosId = await Application.getIosIdForVendorAsync();
        deviceId = iosId || deviceId;
      }

      const response = await apiService.post<any>(
        "/public/auth/login/credential",
        {
          email: email,
          password: password,
        },
        {
          headers: {
            'x-platform': 'MOBILE',
            'x-device-id': deviceId,
            'x-device-name': deviceName,
          }
        }
      );

      const { accessToken, refreshToken } = response?.data || {};
      
      if (accessToken) {
        // ✅ Lưu token
        dispatch(setToken(accessToken));
        dispatch(setRefreshToken(refreshToken));
        apiService.setAuthToken(accessToken);

        // ✅ Sync preferences from server
        try {
          const resultAction = await dispatch(fetchUserPreferences());
          if (fetchUserPreferences.fulfilled.match(resultAction)) {
             const prefs = resultAction.payload;
             if (prefs?.language) {
               i18n.changeLanguage(prefs.language);
             }
          }
        } catch (profileError) {
          console.warn("Failed to fetch preferences:", profileError);
        }

        showSuccess(t("AUTH.MSG_WELCOME_BACK"), t("AUTH.MSG_LOGIN_SUCCESS"));

        setTimeout(() => {
          router.replace("/(tabs)/account");
        }, 500);
      } else {
        // Trường hợp API trả về 200 nhưng không có token (logic lạ)
        showError(t("AUTH.ERR_LOGIN_FAILED"), t("AUTH.ERR_NO_TOKEN"));
      }

    } catch (error: any) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case ENUM_STATUS_CODE_ERROR.USER_NOT_FOUND:
            showError(t("AUTH.ERR_LOGIN_FAILED"), t("AUTH.ERR_USER_NOT_FOUND"));
            setErrors((prev) => ({
              ...prev,
              email: t("AUTH.ERR_EMAIL_NOT_EXIST"),
            }));
            break;
          case ENUM_STATUS_CODE_ERROR.USER_PASSWORD_NOT_MATCH:
            showError(t("AUTH.ERR_LOGIN_FAILED"), t("AUTH.ERR_INCORRECT_PASSWORD"));
            setErrors((prev) => ({
              ...prev,
              password: t("AUTH.ERR_INCORRECT_PASSWORD"),
            }));
            break;
          default:
            showError(t("COMMON.ERROR"), t("AUTH.ERR_SOMETHING_WENT_WRONG"));
        }
      }
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    dispatch(setIsFirstLaunch(false)); // Đánh dấu không còn lần đầu
    router.push("/(auth)/sign-up");
  };

  return (
    <AuthContainer className="pt-2">
      {/* 2. Header: Logo & Titles */}
      <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()}>
        <AuthHeader />
      </Animated.View>

      {/* 3. Form Inputs */}
      <Animated.View entering={FadeInUp.delay(400).duration(1000).springify()}>
        <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
          <View className="gap-4 mb-6">
            <AppInput
              label={t("AUTH.LABEL_EMAIL")}
              placeholder="hello@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              errorText={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Icon name="Mail" size={20} color={colors.neutrals100} />}
              labelClassName="font-sans-bold"
            />

            <AppInput
              label={t("AUTH.LABEL_PASSWORD")}
              placeholder="••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password)
                  setErrors({ ...errors, password: undefined });
              }}
              errorText={errors.password}
              secureTextEntry={!showPassword}
              leftIcon={<Icon name="Lock" size={20} color={colors.neutrals100} />}
              labelClassName="font-sans-bold"
              rightIcon={
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? "EyeOff" : "Eye"}
                    size={20}
                    color={colors.neutrals100}
                  />
                </Pressable>
              }
            />
            <View className="items-end">
              <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                <AppText className="text-primary font-sans-medium text-sm">
                  {t("AUTH.TITLE_FORGOT_PASSWORD")}?
                </AppText>
              </Pressable>
            </View>
          </View>

          {/* 4. Actions Buttons */}
          <View className="gap-3 mb-8">
            <AppButton
              variant="ghost"
              size="lg"
              onPress={handleSignIn}
              loading={loading}
              className="w-full h-14 rounded-full shadow-md"
              style={{
                height: 56,
                borderRadius: 100,
                backgroundColor: "#2563eb",
                justifyContent: "center",
                alignItems: "center",
              }}
              textClassname="text-white font-sans-semibold"
            >
              {t("AUTH.BTN_LOGIN")}
            </AppButton>

            <AppButton
              variant="ghost" 
              size="lg"
              onPress={() => router.push("/(auth)/guest-sos")}
              className="w-full h-14 rounded-full shadow-md"
              style={{
                height: 56,
                borderRadius: 100,
                backgroundColor: theme === "dark" ? "#334155" : "#ffffff",
                borderWidth: 2,
                borderColor: "#D32F2F", 
                justifyContent: "center",
                alignItems: "center",
              }}
              textClassname="text-red-600 dark:text-red-400 font-sans-bold"
            >
              {t("AUTH.BTN_GUEST_SOS")}
            </AppButton>
          </View>
        </View>
      </Animated.View>

      {/* 5. Footer: Register Link */}
      <Animated.View entering={FadeInUp.delay(600).duration(1000).springify()}>
        <View className="flex-row justify-center items-center mt-8 gap-1">
          <AppText className="text-neutrals600 dark:text-neutrals400 text-lg font-sans-regular">
            {t("AUTH.HINT_NO_ACCOUNT")}
          </AppText>
          <Pressable onPress={handleRegister}>
            <AppText
              className="text-lg font-sans-bold"
              style={{ color: "#2563eb" }}
            >
              {t("AUTH.LINK_REGISTER")}
            </AppText>
          </Pressable>
        </View>
      </Animated.View>
    </AuthContainer>
  );
}

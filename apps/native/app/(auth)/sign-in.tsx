import React, { useState } from "react";
import { View, Pressable, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router"; // Giả sử dùng Expo Router
import { useTranslation } from "react-i18next"; // Dựa trên file i18n config
import { cn } from "@/utils";
import { ApiError, apiService } from "@/services/api.service";

// Components của bạn
import AuthContainer from "@/components/auth/AuthContainer";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui";

// Redux (để đổi theme/lang - dựa trên context cũ)
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLanguage, setTheme, setToken } from "@/store/slices/appSlice"; // Giả định action
import { useToast } from "@/components/ui/ToastProvider";

import AuthHeader from "@/components/auth/header";
import { ENUM_STATUS_CODE_ERROR } from "@repo/shared";

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.app);
  const { showError, showSuccess } = useToast();

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
      const response = await apiService.post<any>(
        "/public/auth/login/credential",
        {
          email: email,
          password: password,
        }
      );

      const token = response?.data?.accessToken;

      if (token) {
        // ✅ Lưu token và chuyển trang
        dispatch(setToken(token));
        apiService.setAuthToken(token);
        showSuccess(t("AUTH.MSG_WELCOME_BACK"), t("AUTH.MSG_LOGIN_SUCCESS"));

        setTimeout(() => {
          router.replace("/(tabs)");
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
    router.push("/(auth)/sign-up");
  };

  return (
    <AuthContainer>
      {/* 2. Header: Logo & Titles */}
      <AuthHeader />

      {/* 3. Form Inputs */}
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
            leftIcon={<Icon name="Mail" className="text-neutrals400 w-5 h-5" />}
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
            leftIcon={<Icon name="Lock" className="text-neutrals400 w-5 h-5" />}
            rightIcon={
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? "EyeOff" : "Eye"}
                  className="text-neutrals400 w-5 h-5"
                />
              </Pressable>
            }
          />
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

          {/* <AppButton
            variant="ghost"
            size="lg"
            onPress={() => {}} // Handle Survival Mode
            className="w-full h-14 rounded-full shadow-md"
            style={{
              backgroundColor: theme === "dark" ? "#334155" : "#ffffff",
              borderWidth: 2,
              borderColor: theme === "dark" ? "#475569" : "#e2e8f0",
              justifyContent: "center", // Căn giữa dọc
              alignItems: "center", // Căn giữa ngang
              flexDirection: "row", // Xếp Icon và Text ngang hàng
              gap: 8,
              height: 56,
              borderRadius: 100,
            }}
            textClassname="text-slate-700 dark:text-slate-200 font-sans-medium"
            // Icon
            icon={
              <Icon
                name="Swords"
                className="text-slate-700 dark:text-slate-200 w-4 h-4"
              />
            }
          >
            {t("FEATURE.SURVIVAL_MODE")}
          </AppButton> */}
        </View>
      </View>
      {/* 5. Footer: Register Link */}
      <View className="flex-row justify-center items-center mt-8 gap-1">
        {/* Text câu hỏi: Màu xám trung tính */}
        <AppText className="text-neutrals600 dark:text-neutrals400 text-lg font-sans-regular">
          {t("AUTH.HINT_NO_ACCOUNT")}
        </AppText>

        {/* Text Link: Màu xanh dương + In đậm */}
        <Pressable onPress={handleRegister}>
          <AppText
            className="text-lg font-sans-bold"
            style={{ color: "#2563eb" }}
          >
            {t("AUTH.LINK_REGISTER")}
          </AppText>
        </Pressable>
      </View>
    </AuthContainer>
  );
}

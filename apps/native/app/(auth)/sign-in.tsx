import React, { useState } from "react";
import { View, Pressable, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router"; // Giả sử dùng Expo Router
import { useTranslation } from "react-i18next"; // Dựa trên file i18n config
import { cn } from "@/utils";
import { apiService } from "@/services/api.service";

// Components của bạn
import AuthContainer from "@/components/auth/AuthContainer";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui";

// Redux (để đổi theme/lang - dựa trên context cũ)
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLanguage, setTheme, setToken } from "@/store/slices/appSlice"; // Giả định action
import { useToast } from "@/components/ui/ToastProvider";

import AuthHeader from "@/components/auth/header";

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

  // Handlers
  const handleToggleTheme = () => {
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  };

  const handleToggleLanguage = () => {
    dispatch(setLanguage(language === "en" ? "vi" : "en"));
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email)
      newErrors.email = t("auth.emailRequired") || "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = t("auth.emailInvalid") || "Invalid email";

    if (!password)
      newErrors.password = t("auth.passwordRequired") || "Password is required";
    else if (password.length < 6)
      newErrors.password = t("auth.passwordLength") || "Min 6 characters";

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
        showSuccess("Welcome back!", "Login successful");

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 500);
      } else {
        // Trường hợp API trả về 200 nhưng không có token (logic lạ)
        showError("Login Failed", "No access token received.");
      }

    } catch (error: any) {
      // ❌ XỬ LÝ LỖI
      console.log(error)
      if (error.message === "EMAIL_NOT_FOUND") {
        showError("Login Failed", "Email does not exist.");
        setErrors((prev) => ({ ...prev, email: "Email not found" })); // Hiển thị lỗi đỏ dưới ô Email
      } else if (error.message === "WRONG_PASSWORD") {
        showError("Login Failed", "Incorrect password.");
        setErrors((prev) => ({ ...prev, password: "Wrong password" })); // Hiển thị lỗi đỏ dưới ô Password
      } else {
        showError("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/(auth)/sign-up");
  };

  return (
    <AuthContainer>
      {/* 1. Top Bar: Theme & Language Toggles */}
      <View className="flex-row justify-between items-center mb-8">
        <TouchableOpacity
          onPress={handleToggleTheme}
          className="w-10 h-10 rounded-full bg-neutrals200 dark:bg-neutrals800 items-center justify-center border border-neutrals300 dark:border-neutrals700"
        >
          <Icon
            name={theme === "dark" ? "Moon" : "Sun"}
            className="text-foreground w-5 h-5"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleLanguage}
          className="px-3 py-1.5 rounded-full bg-background border border-neutrals300 dark:border-neutrals700"
        >
          <AppText variant="label" weight="medium">
            {language === "en" ? "VN" : "EN"}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 2. Header: Logo & Titles */}
      <AuthHeader />

      {/* 3. Form Inputs */}
      <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
        <View className="gap-4 mb-6">
          <AppInput
            label={t("EMAIL") || "Email"}
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
            label={t("PASSWORD") || "Password"}
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
            // 👉 ÉP MÀU NỀN TRỰC TIẾP (Mã màu Blue-600 chuẩn)
            style={{
              height: 56,
              borderRadius: 100,
              backgroundColor: "#2563eb",
              justifyContent: "center",
              alignItems: "center",
            }}
            textClassname="text-white font-sans-semibold"
          >
            {t("LOGIN") || "Sign In"}
          </AppButton>

          <AppButton
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
            {t("SURVIAL_MODE") || "Survival Mode"}
          </AppButton>
        </View>
      </View>
      {/* 5. Footer: Register Link */}
      <View className="flex-row justify-center items-center mt-8 gap-1">
        {/* Text câu hỏi: Màu xám trung tính */}
        <AppText className="text-neutrals600 dark:text-neutrals400 text-lg font-sans-regular">
          {t("NO_ACCOUNT") || "Don't have an account?"}
        </AppText>

        {/* Text Link: Màu xanh dương + In đậm */}
        <Pressable onPress={handleRegister}>
          <AppText
            className="text-lg font-sans-bold"
            // 👉 Dùng style đè màu xanh dương (#2563eb) để giống hệt ảnh
            style={{ color: "#2563eb" }}
          >
            {t("REGISTER") || "Register Now"}
          </AppText>
        </Pressable>
      </View>
    </AuthContainer>
  );
}

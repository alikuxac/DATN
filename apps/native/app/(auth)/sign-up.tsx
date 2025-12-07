import React, { useState } from "react";
import { View, Pressable, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

// Components
import AuthContainer from "@/components/auth/AuthContainer";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui"; // ❌ Bỏ import Select

// Redux & Logic
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTheme, setLanguage } from "@/store/slices/appSlice";
import { useToast } from "@/components/ui/ToastProvider";
import { getRegisterSchema, RegisterFormData } from "@/validations/common";
import { apiService } from "@/services/api.service";

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { theme, language } = useAppSelector((state) => state.app);
  const { showError, showSuccess } = useToast();

  // State
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // ❌ ĐÃ XÓA: gender: "other",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ❌ ĐÃ XÓA: genderOptions

  // Helper update form
  const updateForm = (key: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
    if (key === "password" && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const validate = () => {
    const schema = getRegisterSchema(t);
    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) newErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  // 👇 XỬ LÝ ĐĂNG KÝ VỚI API
  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Payload: Đã bỏ gender
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Gọi API
      await apiService.post("/public/auth/sign-up", payload);

      showSuccess(
        "Account Created",
        `Welcome to FloodAid, ${formData.firstName}! Please verify your email.`
      );

      setTimeout(() => {
        router.replace("/(auth)/sign-in");
      }, 1000);
    } catch (error: any) {
      console.error("Register Error:", error);
      if (error.message && error.message.includes("email")) {
        setErrors((prev) => ({
          ...prev,
          email: t("VALIDATION.EMAIL_EXISTS") || "Email already exists",
        }));
        showError("Registration Failed", "This email is already in use.");
      } else {
        showError(
          "Error",
          error.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTheme = () =>
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  const handleToggleLanguage = () =>
    dispatch(setLanguage(language === "en" ? "vi" : "en"));

  const FirstNameInput = (
    <View className="flex-1">
      <AppInput
        label={t("FIRST_NAME") || "First Name"}
        placeholder="John"
        value={formData.firstName}
        onChangeText={(val) => updateForm("firstName", val)}
        errorText={errors.firstName}
      />
    </View>
  );

  const LastNameInput = (
    <View className="flex-1">
      <AppInput
        label={t("LAST_NAME") || "Last Name"}
        placeholder="Doe"
        value={formData.lastName}
        onChangeText={(val) => updateForm("lastName", val)}
        errorText={errors.lastName}
      />
    </View>
  );

  return (
    <AuthContainer>
      <View className="flex-row justify-between items-center mb-6">
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

      <View className="items-center mb-8">
        <View className="w-16 h-16 items-center justify-center mb-2">
          <AppText style={{ fontSize: 50 }}>💧</AppText>
        </View>
        <AppText variant="heading1" weight="bold" className="mb-1 text-3xl">
          FloodAid
        </AppText>
        <AppText variant="body" color="muted">
          Create Your Account
        </AppText>
      </View>

      <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
        <View className="gap-4">
          <View className="flex-row gap-3">
            {language === "vi" ? (
              <>
                {LastNameInput}
                {FirstNameInput}
              </>
            ) : (
              <>
                {FirstNameInput}
                {LastNameInput}
              </>
            )}
          </View>

          <AppInput
            label={t("EMAIL")}
            placeholder="you@example.com"
            value={formData.email}
            onChangeText={(val) => updateForm("email", val)}
            errorText={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label={t("PASSWORD")}
            placeholder="At least 6 characters"
            value={formData.password}
            onChangeText={(val) => updateForm("password", val)}
            errorText={errors.password}
            secureTextEntry={!showPassword}
            rightIcon={
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? "EyeOff" : "Eye"}
                  className="text-neutrals400 w-5 h-5"
                />
              </Pressable>
            }
          />

          <AppInput
            label={t("CONFIRM_PASSWORD")}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChangeText={(val) => updateForm("confirmPassword", val)}
            errorText={errors.confirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightIcon={
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? "EyeOff" : "Eye"}
                  className="text-neutrals400 w-5 h-5"
                />
              </Pressable>
            }
          />

          {/* ❌ ĐÃ XÓA: Select Gender */}
        </View>

        <AppButton
          variant="ghost"
          size="lg"
          onPress={handleRegister}
          loading={loading}
          className="w-full shadow-md"
          style={{
            backgroundColor: "#2563eb",
            height: 56,
            borderRadius: 100,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
          textClassname="text-white font-sans-bold text-lg"
        >
          {t("CREATE_ACCOUNT") || "Create Account"}
        </AppButton>
      </View>

      <View className="flex-row justify-center items-center mt-8 gap-1">
        <AppText className="text-neutrals600 dark:text-neutrals400 text-sm font-sans-regular">
          {t("ALREADY_HAVE_AN_ACCOUNT") || "Already have an account?"}
        </AppText>
        <Pressable onPress={() => router.push("/(auth)/sign-in")}>
          <AppText
            className="text-sm font-sans-bold"
            style={{ color: "#2563eb" }}
          >
            {t("LOGIN") || "Sign In"}
          </AppText>
        </Pressable>
      </View>
    </AuthContainer>
  );
}

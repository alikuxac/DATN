import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

// Components
import AuthContainer from "@/components/auth/AuthContainer";
import { AppText, AppInput, AppButton, Icon } from "@/components/ui"; // ❌ Bỏ import Select

// Redux & Logic
import { useToast } from "@/components/ui/ToastProvider";
import { getRegisterSchema, RegisterFormData } from "@/validations/common";
import { apiService, ApiError } from "@/services/api.service";
import { getDeviceLanguage } from "@/utils/getDeviceLanguage";
import { ENUM_STATUS_CODE_ERROR } from "@repo/shared";
import AuthHeader from "@/components/auth/header";

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const language = getDeviceLanguage();
  // State
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        language,
      };

      // Gọi API
      await apiService.post("/public/auth/sign-up", payload);

      showSuccess(
        t("AUTH.TITLE_ACCOUNT_CREATED"),
        t("AUTH.MSG_SIGNUP_SUCCESS", { firstName: formData.firstName })
      );

      setTimeout(() => {
        router.replace("/(auth)/sign-in");
      }, 1000);
    } catch (error: any) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case ENUM_STATUS_CODE_ERROR.USER_EMAIL_EXIST:
            setErrors((prev) => ({
              ...prev,
              email: t("VALIDATION.EMAIL_EXISTS"),
            }));
            break;
          default:
            showError(
              "Error",
              error.message || "Something went wrong. Please try again."
            );
            break;
        }
      }
      console.error("Register Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const FirstNameInput = (
    <View className="flex-1">
      <AppInput
        label={t("AUTH.LABEL_FIRST_NAME")}
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
        label={t("AUTH.LABEL_LAST_NAME")}
        placeholder="Doe"
        value={formData.lastName}
        onChangeText={(val) => updateForm("lastName", val)}
        errorText={errors.lastName}
      />
    </View>
  );

  return (
    <AuthContainer>
      <AuthHeader />

      <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
        <View className="gap-4">
          <View className="flex-row gap-3">
            {language === "en" ? (
              <>
                {FirstNameInput}
                {LastNameInput}
              </>
            ) : (
              <>
                {LastNameInput}
                {FirstNameInput}
              </>
            )}
          </View>

          <AppInput
            label={t("AUTH.LABEL_EMAIL")}
            placeholder="you@example.com"
            value={formData.email}
            onChangeText={(val) => updateForm("email", val)}
            errorText={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <AppInput
            label={t("AUTH.LABEL_PASSWORD")}
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
            label={t("AUTH.LABEL_CONFIRM_PASSWORD")}
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
          {t("AUTH.BTN_REGISTER")}
        </AppButton>
      </View>

      <View className="flex-row justify-center items-center mt-8 gap-1">
        <AppText className="text-neutrals600 dark:text-neutrals400 text-sm font-sans-regular">
          {t("AUTH.HINT_HAS_ACCOUNT")}
        </AppText>
        <Pressable onPress={() => router.push("/(auth)/sign-in")}>
          <AppText
            className="text-sm font-sans-bold"
            style={{ color: "#2563eb" }}
          >
            {t("AUTH.LINK_LOGIN")}
          </AppText>
        </Pressable>
      </View>
    </AuthContainer>
  );
}

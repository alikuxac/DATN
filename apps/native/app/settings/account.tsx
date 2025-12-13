import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText, AppInput, AppButton, Select, Avatar } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { apiService } from "@/services/api.service";
// 👇 1. Import Enum và Interface từ shared package
import {
  IUserProfileReponse,
  IUserUpdateProfileRequest,
  ENUM_USER_GENDER,
  IResponse,
} from "@repo/shared";

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(false);
  // 👇 2. State dùng đúng Interface
  const [userData, setUserData] = useState<Partial<IUserProfileReponse>>({});

  // 👇 3. Options dùng Enum chuẩn
  const genderOptions = [
    {
      label: t("PROFILE.GENDER_OPTIONS.MALE"),
      value: ENUM_USER_GENDER.MALE,
    },
    {
      label: t("PROFILE.GENDER_OPTIONS.FEMALE"),
      value: ENUM_USER_GENDER.FEMALE,
    },
    {
      label: t("PROFILE.GENDER_OPTIONS.OTHER"),
      value: ENUM_USER_GENDER.OTHER,
    },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Dùng generic để response trả về đúng kiểu
      const res = await apiService.get<IResponse<IUserProfileReponse>>(
        "/shared/user/profile"
      );
      if (res.data) {
        setUserData(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Payload chuẩn theo Interface Update Request
      const payload: IUserUpdateProfileRequest = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        // Ép kiểu về ENUM_USER_GENDER để tránh lỗi string
        gender: (userData.gender as ENUM_USER_GENDER) || ENUM_USER_GENDER.OTHER,
      };

      await apiService.put("/shared/user/profile", payload);

      showSuccess(
        t("COMMON.SUCCESS"),
        t("PROFILE.MSG_PROFILE_UPDATED")
      );
      router.back();
    } catch (error: any) {
      showError(t("COMMON.ERROR"), error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.content}>
          <View style={styles.avatarSection}>
            <Avatar
              text={`${userData.firstName || ""} ${userData.lastName || ""}`}
              size="xl"
              className="mb-4 bg-blue-100"
              textClassName="text-blue-600 text-2xl"
            />
            <AppText style={{ color: colors.neutrals400 }}>
              {userData.email}
            </AppText>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("AUTH.LABEL_FIRST_NAME")}
                  value={userData.firstName}
                  onChangeText={(v) =>
                    setUserData({ ...userData, firstName: v })
                  }
                />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 1 }}>
                <AppInput
                  label={t("AUTH.LABEL_FIRST_NAME")}
                  value={userData.lastName}
                  onChangeText={(v) =>
                    setUserData({ ...userData, lastName: v })
                  }
                />
              </View>
            </View>

            <View>
              <AppText style={[styles.label, { color: colors.foreground }]}>
                {t("PROFILE.LABEL_GENDER")}
              </AppText>
              <Select
                options={genderOptions}
                value={userData?.gender as ENUM_USER_GENDER}
                // 👇 Cập nhật state với đúng type Enum
                onValueChange={(val: any) =>
                  setUserData({ ...userData, gender: val as ENUM_USER_GENDER })
                }
                placeholder={
                  t("PROFILE.LABEL_SELECT_GENDER")
                }
              />
            </View>

            {/* Email & Phone Readonly */}
            <AppInput
              label="Email"
              value={userData.email}
              editable={false}
              style={{ color: colors.neutrals400 }}
            />
            {/* <AppInput
              label={t("PHONE") || "Số điện thoại"}
              value={userData.mobileNumber}
              editable={false}
              helperText="Liên hệ Admin để thay đổi số điện thoại"
              style={{ color: colors.neutrals400 }}
            /> */}
          </View>

          <AppButton
            onPress={handleSave}
            disabled={loading}
            loading={loading}
            style={{ marginTop: 32 }}
          >
            {t("COMMON.BTN_SAVE_CHANGES")}
          </AppButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  form: { gap: 20 },
  row: { flexDirection: "row" },
  label: { marginBottom: 8, fontWeight: "500", fontSize: 14 },
});

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
import { AppText, AppInput, AppButton, Select, Avatar, Badge } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { useToast } from "@/components/ui/ToastProvider";
import { apiService } from "@/services/api.service";
import {
  IUserProfileReponse,
  IUserUpdateProfileRequest,
  ENUM_USER_GENDER,
  IResponse,
} from "@repo/shared";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, AlertCircle, Phone } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { OTPVerificationModal } from "@/components/ui/OTPVerificationModal";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/appSlice";


export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { showSuccess, showError } = useToast();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState<Partial<IUserProfileReponse>>({});
  const [mobileNumber, setMobileNumber] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);

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
        setMobileNumber(res.data.mobileNumber || "");
        dispatch(setUser(res.data));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const promises = [];

      // 1. Update Profile Info (Name, Gender)
      const payload: IUserUpdateProfileRequest = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        gender: (userData.gender as ENUM_USER_GENDER) || ENUM_USER_GENDER.OTHER,
        mobileNumber: mobileNumber || "",
      };
      promises.push(apiService.put("/shared/user/profile/update", payload));

      await Promise.all(promises);

      showSuccess(
        t("COMMON.SUCCESS"),
        t("PROFILE.MSG_PROFILE_UPDATED")
      );
      
      // Reload profile to reflect changes (e.g. unverified status)
      await loadProfile();

    } catch (error: any) {
      showError(t("COMMON.ERROR"), error.message || "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error(error);
      showError(t("COMMON.ERROR"), "Không thể chọn ảnh");
    }
  };

  const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
        // Optimistic update
        const oldAvatar = userData.avatar;
        setUserData({ ...userData, avatar: asset.uri }); // Show local image immediately

        const formData = new FormData();
        // @ts-ignore
        formData.append("file", {
            uri: asset.uri,
            name: asset.fileName || "avatar.jpg",
            type: asset.mimeType || "image/jpeg",
        });

        await apiService.uploadFormData("/user/users/avatar/upload", formData);
        
        showSuccess(t("COMMON.SUCCESS"), "Cập nhật ảnh đại diện thành công");
        await loadProfile(); // Reload to get remote URL
    } catch (error: any) {
        showError(t("COMMON.ERROR"), "Upload ảnh thất bại");
        // Revert
        await loadProfile();
    }
  };

  const handleVerifyRequest = async () => {
      try {
          // Resend OTP before opening modal
          setLoading(true);
          await apiService.post("/user/verification/resend/mobile-number", { mobileNumber: userData.mobileNumber });
          setShowOtpModal(true);
      } catch (error: any) {
          showError(t("COMMON.ERROR"), error.message || "Không thể gửi mã OTP");
      } finally {
          setLoading(false);
      }
  };

  const handleVerifyOtp = async (otp: string) => {
      await apiService.post("/user/verification/verify/mobile-number", { otp });
      showSuccess(t("COMMON.SUCCESS"), "Xác thực số điện thoại thành công");
      await loadProfile();
  };

  const handleVerifyEmailRequest = async () => {
      try {
          setLoading(true);
          await apiService.post("/user/verification/resend/email", {});
          showSuccess(t("COMMON.SUCCESS"), "Mã OTP đã được gửi đến email của bạn.");
          setShowEmailOtpModal(true);
      } catch (error: any) {
          showError(t("COMMON.ERROR"), error.message || "Không thể gửi email xác thực");
      } finally {
          setLoading(false);
      }
  };

  const handleVerifyEmailOtp = async (otp: string) => {
      await apiService.post("/user/verification/verify/email", { otp });
      showSuccess(t("COMMON.SUCCESS"), "Xác thực email thành công!");
      await loadProfile();
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
              source={userData.avatar}
              text={`${userData.firstName || ""} ${userData.lastName || ""}`}
              size="xl"
              className="mb-4 bg-blue-100"
              textClassName="text-blue-600 text-2xl"
            />
             <TouchableOpacity 
                style={styles.editAvatarButton} 
                onPress={handlePickImage}
            >
                <Camera size={16} color="#000" />
            </TouchableOpacity>
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
                  label={t("AUTH.LABEL_LAST_NAME")}
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


            {/* Email with Verification Status */}
            <View>
                <AppInput
                  label="Email"
                  value={userData.email}
                  editable={false}
                  style={{ color: colors.neutrals400 }}
                />
                {/* Email Verification Status */}
                {userData.email && (
                    <View style={styles.verificationContainer}>
                        {userData.verification?.email ? (
                            <View style={styles.verifiedBadge}>
                                <Check size={14} color="#16a34a" />
                                <AppText style={styles.verifiedText}>Đã xác thực</AppText>
                            </View>
                        ) : (
                            <View style={styles.unverifiedContainer}>
                                <View style={styles.unverifiedBadge}>
                                    <AlertCircle size={14} color="#ea580c" />
                                    <AppText style={styles.unverifiedText}>Chưa xác thực</AppText>
                                </View>
                                <TouchableOpacity onPress={handleVerifyEmailRequest}>
                                    <AppText style={styles.verifyLink}>Verify Now</AppText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Phone Number */}
            <View>
                <AppInput
                    label={t("PHONE") || "Số điện thoại"}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    placeholder="Nhập số điện thoại"
                />
                {/* Verification Status */}
                {userData.mobileNumber && (
                    <View style={styles.verificationContainer}>
                        {userData.verification?.mobileNumber ? (
                            <View style={styles.verifiedBadge}>
                                <Check size={14} color="#16a34a" />
                                <AppText style={styles.verifiedText}>Đã xác thực</AppText>
                            </View>
                        ) : (
                            <View style={styles.unverifiedContainer}>
                                <View style={styles.unverifiedBadge}>
                                    <AlertCircle size={14} color="#ea580c" />
                                    <AppText style={styles.unverifiedText}>Chưa xác thực</AppText>
                                </View>
                                <TouchableOpacity onPress={handleVerifyRequest}>
                                    <AppText style={styles.verifyLink}>Verify Now</AppText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
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
      <OTPVerificationModal 
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        contact={userData.mobileNumber || ""}
        type="phone"
      />
      <OTPVerificationModal 
        visible={showEmailOtpModal}
        onClose={() => setShowEmailOtpModal(false)}
        onVerify={handleVerifyEmailOtp}
        contact={userData.email || ""}
        type="email"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  form: { gap: 20 },
  row: { flexDirection: "row" },
  label: { marginBottom: 8, fontWeight: "500", fontSize: 14 },
  verificationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
  },
  verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  verifiedText: {
      color: '#16a34a', // green-600
      fontSize: 12,
      fontWeight: '500',
  },
  unverifiedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: 1,
  },
  unverifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  unverifiedText: {
      color: '#ea580c', // orange-600
      fontSize: 12,
      fontWeight: '500',
  },
  verifyLink: {
      color: '#2563eb', // blue-600
      fontSize: 13,
      fontWeight: '600',
      textDecorationLine: 'underline',
  }
});

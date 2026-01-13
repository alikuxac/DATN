import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { AppText, AppButton, Icon } from "@/components/ui";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { OTPVerificationModal } from "@/components/ui/OTPVerificationModal";
import { apiService } from "@/services/api.service";
import { useToast } from "@/components/ui/ToastProvider";

interface PhoneSettingsCardProps {
  userData: any;
  colors: any;
  t: any;
  onUpdateSuccess: () => void;
}

export const PhoneSettingsCard = ({ userData, colors, t, onUpdateSuccess }: PhoneSettingsCardProps) => {
  const [mobileNumber, setMobileNumber] = useState(userData?.mobileNumber || "");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (userData?.mobileNumber) {
        setMobileNumber(userData.mobileNumber);
    }
  }, [userData]);

  const handleSendOtp = async () => {
    if (!mobileNumber) return;
    setLoading(true);
    try {
      await apiService.post("/users/phone/send-otp", { mobileNumber });
      showSuccess(t("COMMON.SUCCESS"), "OTP sent via Telegram");
      setIsModalVisible(true);
    } catch (error: any) {
       showError(t("COMMON.ERROR"), error?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    try {
      await apiService.post("/users/phone/verify-otp", { code: otp });
      showSuccess(t("COMMON.SUCCESS"), "Phone number verified!");
      onUpdateSuccess();
    } catch (error: any) {
        showError(t("COMMON.ERROR"), error?.message || "Invalid OTP");
        throw error; // Re-throw to keep modal open or handle inside modal
    }
  };

  const isVerified = userData?.verification?.mobileNumber && userData?.mobileNumber === mobileNumber;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <AppText style={[styles.title, { color: colors.foreground }]}>{t("PROFILE.LABEL_PHONE")}</AppText>
      
      <View style={styles.content}>
        <View style={{ flex: 1, marginRight: 8 }}>
            <PhoneInput 
                value={mobileNumber} 
                onChangeText={setMobileNumber}
                // Country Picker logic can be enhanced to update calling code
            />
        </View>
        <TouchableOpacity 
            style={[styles.statusButton, isVerified ? styles.verifiedBtn : styles.verifyBtn]}
            onPress={isVerified ? undefined : handleSendOtp}
            disabled={loading || isVerified}
        >
             {loading ? (
                 <AppText style={styles.btnText}>...</AppText>
             ) : isVerified ? (
                 <Icon name="Check" size={16} color="white" />
             ) : (
                 <AppText style={styles.btnText}>{t("COMMON.BTN_VERIFY") || "Verify"}</AppText>
             )}
        </TouchableOpacity>
      </View>
      
      {isVerified && (
          <View style={[styles.verifiedBadge, { backgroundColor: "#dcfce7" }]}>
              <Icon name="Check" size={12} color="#16a34a" />
              <AppText style={[styles.verifiedText, { color: "#16a34a", marginTop: 0, marginLeft: 4 }]}>
                  Verified
              </AppText>
          </View>
      )}

      <OTPVerificationModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onVerify={handleVerifyOtp}
        mobileNumber={mobileNumber}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusButton: {
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 12,
      borderRadius: 8,
  },
  verifyBtn: {
      backgroundColor: "#2563eb",
  },
  verifiedBtn: {
      backgroundColor: "#16a34a",
  },
  btnText: {
      color: "white",
      fontWeight: "600",
      fontSize: 13
  },
  verifiedText: {
      color: "#16a34a",
      fontSize: 12,
      marginTop: 4,
      fontWeight: "500"
  },
  verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8
  }
});

import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, AppInput, AppButton, Icon } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import AuthContainer from '@/components/auth/AuthContainer';
import { authService } from '@/services/auth.service';

import AuthHeaderActions from "@/components/auth/AuthHeaderActions";
import { useColors } from "@/hooks/useColors";

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colors = useColors();

  const handleVerify = async () => {
    if (!otp || otp.length !== 8) {
      setError(t('AUTH.DESC_OTP_HINT'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.verifyOTP(token, otp);
      
      router.push({
        pathname: '/(auth)/forgot-password/reset',
        params: { token }, // Pass token to reset screen
      });
    } catch (err: any) {
        // Fallback error message if translation missing or specific error
      showError(t('COMMON.ERROR'), err.response?.data?.message || t('AUTH.ERR_SOMETHING_WENT_WRONG'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <View className="items-end mb-4">
        <AuthHeaderActions />
      </View>

      <View className="items-center mb-8 pt-10">
        <Icon name="ShieldCheck" className="w-16 h-16 text-primary mb-4" />
        <AppText className="text-3xl font-sans-bold text-foreground mb-2">
           {t('AUTH.TITLE_VERIFY_OTP')}
        </AppText>
        <AppText className="text-neutrals500 text-center px-4 font-sans-regular">
          {t('AUTH.DESC_VERIFY_OTP')}
        </AppText>
        {email && (
             <AppText className="text-neutrals400 text-sm mt-2 font-sans-medium">
                {email}
             </AppText>
        )}
      </View>

      <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
        <AppInput
          label={t('AUTH.LABEL_OTP')}
          placeholder="123456789012"
          value={otp}
          onChangeText={(text) => {
            setOtp(text);
            if (error) setError('');
          }}
          errorText={error}
          maxLength={8}
          keyboardType="number-pad"
          leftIcon={<Icon name="Hash" size={20} color={colors.neutrals100} />}
        />

        <AppButton
          variant="primary"
          size="lg"
          onPress={handleVerify}
          loading={loading}
          textClassname="text-white font-sans-semibold"
          className="w-full h-14 rounded-full mt-2 bg-blue-600"
        >
          {t('AUTH.BTN_VERIFY')}
        </AppButton>
        
         <AppButton
            variant="ghost"
            onPress={() => router.back()}
            className="w-full h-14 rounded-full"
            textClassname="text-neutrals600 dark:text-neutrals400 font-sans-medium"
        >
            {t('COMMON.CANCEL')}
        </AppButton>
      </View>
    </AuthContainer>
  );
}

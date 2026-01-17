import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, AppInput, AppButton, Icon } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import AuthHeader from '@/components/auth/header';
import AuthContainer from '@/components/auth/AuthContainer';
import { authService } from '@/services/auth.service';
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colors = useColors();

  const handleSendCode = async () => {
    if (!email) {
      setError(t('VALIDATION.REQUIRED', { field: t('AUTH.LABEL_EMAIL') }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('VALIDATION.EMAIL_INVALID'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.requestPasswordReset(email);
      const token = response?.data?.token;

      if (token) {
        router.push({
          pathname: '/(auth)/forgot-password/verify',
          params: { token, email }, // Pass token and email to verify screen
        });
      }
    } catch (err: any) {
      showError(t('COMMON.ERROR'), err.response?.data?.message || t('AUTH.ERR_SOMETHING_WENT_WRONG'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
       {/* Reusing AuthHeader with custom title if needed, or just default specific header */}
      <View className="items-center mb-8 pt-10">
        <Icon name="KeyRound" className="w-16 h-16 text-primary mb-4" />
        <AppText className="text-3xl font-sans-bold text-foreground mb-2">
           {t('AUTH.TITLE_FORGOT_PASSWORD')}
        </AppText>
        <AppText className="text-neutrals500 text-center px-4 font-sans-regular">
          {t('AUTH.DESC_FORGOT_PASSWORD')}
        </AppText>
      </View>

      <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
        <AppInput
          label={t('AUTH.LABEL_EMAIL')}
          placeholder="admin@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          errorText={error}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<Icon name="Mail" size={20} color={colors.neutrals100} />}
        />

        <AppButton
          variant="primary"
          size="lg"
          onPress={handleSendCode}
          loading={loading}
          textClassname="text-white font-sans-semibold"
          className="w-full h-14 rounded-full mt-2 bg-blue-600"
        >
          {t('AUTH.BTN_SEND_CODE')}
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

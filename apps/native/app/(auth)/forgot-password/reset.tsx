import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, AppInput, AppButton, Icon } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import AuthContainer from '@/components/auth/AuthContainer';
import { authService } from '@/services/auth.service';
import { useColors } from "@/hooks/useColors";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const colors = useColors();

  const validate = () => {
      const newErrors: any = {};
      const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

      if (newPassword.length < 8) {
        newErrors.newPassword = t('VALIDATION.PASSWORD_MIN_LENGTH');
      } else if (!passwordRegex.test(newPassword)) {
        newErrors.newPassword = t('VALIDATION.PASSWORD_WEAK'); // Make sure this key exists or use a hardcoded string/fallback
      }

      if (newPassword !== confirmPassword) newErrors.confirmPassword = t('VALIDATION.PASSWORD_MISMATCH');
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      
      showSuccess(t('COMMON.SUCCESS'), t('AUTH.MSG_PASSWORD_RESET_SUCCESS'));
      
      setTimeout(() => {
         router.replace('/(auth)/sign-in');
      }, 1500);

    } catch (err: any) {
      console.log('Reset password error:', err);
      // Fix: Access err.message for ApiError
      showError(t('COMMON.ERROR'), err.message || t('AUTH.ERR_SOMETHING_WENT_WRONG'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContainer>
      <View className="items-center mb-8 pt-10">
        <Icon name="LockKeyhole" className="w-16 h-16 text-primary mb-4" />
        <AppText className="text-3xl font-sans-bold text-foreground mb-2">
           {t('AUTH.TITLE_RESET_PASSWORD')}
        </AppText>
        <AppText className="text-neutrals500 text-center px-4 font-sans-regular">
          {t('AUTH.DESC_RESET_PASSWORD')}
        </AppText>
      </View>

      <View className="bg-white dark:bg-neutrals900 rounded-3xl p-6 shadow-xl border border-neutrals200 dark:border-neutrals800 gap-6">
        <AppInput
          label={t('AUTH.LABEL_NEW_PASSWORD')}
          placeholder="••••••••"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (errors.newPassword) setErrors({...errors, newPassword: undefined});
          }}
          errorText={errors.newPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Icon name="Lock" size={20} color={colors.neutrals100} />}
          rightIcon={
            <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} color={colors.neutrals100} />
            </Pressable>
          }
        />

        <AppInput
          label={t('AUTH.LABEL_CONFIRM_PASSWORD')}
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors({...errors, confirmPassword: undefined});
          }}
          errorText={errors.confirmPassword}
          secureTextEntry={!showPassword}
          leftIcon={<Icon name="Lock" size={20} color={colors.neutrals100} />}
        />

        <AppButton
          variant="primary"
          size="lg"
          onPress={handleReset}
          loading={loading}
          textClassname="text-white font-sans-semibold"
          className="w-full h-14 rounded-full mt-2 bg-blue-600"
        >
          {t('AUTH.BTN_RESET_PASSWORD')}
        </AppButton>
      </View>
    </AuthContainer>
  );
}

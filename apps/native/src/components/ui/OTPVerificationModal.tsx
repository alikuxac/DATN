import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { AppText, AppButton } from '@/components/ui';

interface OTPVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  mobileNumber: string;
}

export const OTPVerificationModal = ({ visible, onClose, onVerify, mobileNumber }: OTPVerificationModalProps) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await onVerify(otp);
      onClose();
    } catch (e) {
      // Error handled by parent or hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <AppText style={styles.title}>Verify OTP</AppText>
          <AppText style={styles.description}>
            Enter the 6-digit code sent to {mobileNumber}.
          </AppText>

          <View style={styles.otpContainer}>
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              editable={!loading}
            />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.cancelButton}>
              <AppText style={styles.cancelText}>Cancel</AppText>
            </TouchableOpacity>
            
            <AppButton 
                onPress={handleVerify} 
                disabled={otp.length !== 6 || loading}
                loading={loading}
                style={styles.verifyButton}
            >
                Verify
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    color: '#0f172a',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  verifyButton: {
      flex: 1
  }
});

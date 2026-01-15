import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, Avatar, Icon } from '@/components/ui';
import { InfoRow } from './InfoRow';
import { uploadAvatar } from '@/api/upload';

interface ProfileCardProps {
  userData: any;
  theme: string;
  colors: any;
  t: any;
  onAvatarUpdate?: (avatarUrl: string) => void;
}

export const ProfileCard = ({ userData, theme, colors, t, onAvatarUpdate }: ProfileCardProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUploadAvatar = async () => {
    // Get token from storage
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      Alert.alert('Lỗi', 'Không tìm thấy token. Vui lòng đăng nhập lại.');
      return;
    }
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh');
      return;
    }

    // Pick image with compression
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setUploading(true);

      try {
        const avatarUrl = await uploadAvatar(asset, token);
        onAvatarUpdate?.(avatarUrl);
        Alert.alert('Thành công', 'Đã cập nhật avatar');
      } catch (error: any) {
        Alert.alert('Lỗi', `Không thể upload avatar: ${error?.message || 'Unknown error'}`);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Avatar
            source={userData?.avatar ? { uri: userData.avatar } : undefined}
            text={`${userData?.firstName} ${userData?.lastName}`}
            size="xl"
            className="bg-blue-100"
            textClassName="text-blue-600 text-2xl"
          />
          <TouchableOpacity
            style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}
            onPress={handleUploadAvatar}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="Camera" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileNameContainer}>
          <AppText style={[styles.profileName, { color: colors.foreground }]}>
            {userData?.firstName} {userData?.lastName}
          </AppText>

          <View style={styles.badgesRow}>
            {/* Role Badge */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    theme === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe',
                },
              ]}
            >
              <AppText style={[styles.badgeText, { color: '#2563eb' }]}>
                {userData?.role?.toUpperCase()}
              </AppText>
            </View>

            {/* Email Verification Badge */}
            {userData?.verification?.email ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#dcfce7', marginLeft: 8 },
                ]}
              >
                <Icon
                  name="Mail"
                  size={12}
                  color="#16a34a"
                  style={{ marginRight: 4 }}
                />
                <AppText style={[styles.badgeText, { color: '#16a34a' }]}>
                  VERIFIED
                </AppText>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#fee2e2', marginLeft: 8 },
                ]}
              >
                <Icon
                  name="Mail"
                  size={12}
                  color="#dc2626"
                  style={{ marginRight: 4 }}
                />
                <AppText style={[styles.badgeText, { color: '#dc2626' }]}>
                  UNVERIFIED
                </AppText>
              </View>
            )}
            
             {/* Mobile Verification Badge */}
            {userData?.verification?.mobileNumber ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#dcfce7', marginLeft: 4 },
                ]}
              >
                <Icon
                  name="Phone"
                  size={12}
                  color="#16a34a"
                  style={{ marginRight: 4 }}
                />
                 <AppText style={[styles.badgeText, { color: '#16a34a' }]}>
                  VERIFIED
                </AppText>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: '#fee2e2', marginLeft: 4 },
                ]}
              >
                <Icon
                  name="Phone"
                  size={12}
                  color="#dc2626"
                  style={{ marginRight: 4 }}
                />
                <AppText style={[styles.badgeText, { color: '#dc2626' }]}>
                  UNVERIFIED
                </AppText>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Thông tin chi tiết (Read-only) */}
      <View style={styles.infoContainer}>
        <InfoRow label="Email" value={userData?.email} colors={colors} />
        <InfoRow
          label={t('PROFILE.LABEL_PHONE')}
          value={userData?.phone}
          colors={colors}
          placeholder={t('PROFILE.VALUE_NO_PHONE')}
        />
        <InfoRow
          label={t('PROFILE.LABEL_GENDER')}
          value={
            userData?.gender
              ? userData.gender.charAt(0).toUpperCase() +
                userData.gender.slice(1)
              : ''
          }
          colors={colors}
          placeholder={t('PROFILE.GENDER_OPTIONS.OTHER')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileNameContainer: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  badgesRow: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  infoContainer: { marginTop: 8 },
});

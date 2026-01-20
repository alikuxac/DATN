import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText, Icon } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from "react-i18next";

interface ReportImagePickerProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  onUpload?: (file: ImagePicker.ImagePickerAsset) => Promise<string>;
}

export const ReportImagePicker = ({
  images,
  onImagesChange,
  maxImages = 5,
  onUpload,
}: ReportImagePickerProps) => {
  const colors = useColors();
  const [uploading, setUploading] = useState<boolean[]>([]);
  const { t } = useTranslation();

  const pickImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert(t('REPORT.IMAGE.LIMIT_TITLE'), t('REPORT.IMAGE.LIMIT_MSG', { max: maxImages }));
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('REPORT.IMAGE.PERMISSION_TITLE'), t('REPORT.IMAGE.PERMISSION_MSG'));
      return;
    }

    // Pick image with compression
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Compress to 50% quality
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Add loading indicator
      setUploading([...uploading, true]);

      try {
        if (onUpload) {
          // Upload to server
          const imageUrl = await onUpload(asset);
          onImagesChange([...images, imageUrl]);
        } else {
          // Just use local URI
          onImagesChange([...images, asset.uri]);
        }
      } catch (error: any) {
        Alert.alert(t('REPORT.IMAGE.ERROR_TITLE'), `${t('REPORT.IMAGE.ERROR_MSG')}: ${error?.message || 'Unknown error'}`);
      } finally {
        setUploading(uploading.slice(0, -1));
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <View style={styles.container}>
      <AppText style={[styles.label, { color: colors.foreground }]}>
        {t('REPORT.IMAGE.LABEL')} ({images.length}/{maxImages})
      </AppText>
      
      <View style={styles.grid}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Icon name="X" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {uploading.map((_, index) => (
          <View key={`loading-${index}`} style={[styles.imageContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ))}

        {images.length + uploading.length < maxImages && (
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={pickImage}
          >
            <Icon name="Plus" size={32} color={colors.neutrals500} />
            <AppText style={[styles.addText, { color: colors.neutrals500 }]}>
              {t('REPORT.IMAGE.ADD')}
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 12,
  },
  addText: {
    fontSize: 12,
    marginTop: 4,
  },
});

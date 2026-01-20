import * as ImagePicker from 'expo-image-picker';
import { apiService } from '@/services/api.service';

/**
 * Upload avatar image
 */
export const uploadAvatar = async (
  asset: ImagePicker.ImagePickerAsset,
  token: string
): Promise<string> => {
  const formData = new FormData();

  // Create file object for upload
  const file = {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: asset.fileName || `avatar_${Date.now()}.jpg`,
  } as any;

  formData.append('file', file);

  // Set token before upload
  apiService.setAuthToken(token);

  const response = await apiService.uploadFormData<{ data: { avatarUrl: string } }>(
    '/users/avatar/upload',
    formData
  );

  return response.data.avatarUrl;
};

/**
 * Delete avatar image
 */
export const deleteAvatar = async (token: string): Promise<void> => {
  apiService.setAuthToken(token);
  await apiService.delete('/users/avatar');
};

/**
 * Upload report images
 */
export const uploadReportImages = async (
  assets: ImagePicker.ImagePickerAsset[],
  token: string
): Promise<string[]> => {
  const formData = new FormData();

  assets.forEach((asset, index) => {
    const file = {
      uri: asset.uri,
      type: asset.mimeType || 'image/jpeg',
      name: asset.fileName || `report_${Date.now()}_${index}.jpg`,
    } as any;

    formData.append('files', file);
  });

  apiService.setAuthToken(token);

  const response = await apiService.uploadFormData<{ data: { imageUrls: string[] } }>(
    '/user/reports/images/upload',
    formData
  );

  return response.data.imageUrls;
};

/**
 * Upload single report image
 */
export const uploadReportImage = async (
  asset: ImagePicker.ImagePickerAsset,
  token: string
): Promise<string> => {
  const urls = await uploadReportImages([asset], token);
  return urls[0];
};

/**
 * Delete report images
 */
export const deleteReportImages = async (
  imageUrls: string[],
  token: string
): Promise<void> => {
  apiService.setAuthToken(token);
  await apiService.delete('/user/reports/images', {
    body: JSON.stringify({ imageUrls }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

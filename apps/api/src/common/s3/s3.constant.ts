export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_REPORT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_REPORT_IMAGES = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const S3_FOLDERS = {
  AVATARS: 'avatars',
  REPORTS: 'reports',
} as const;

/**
 * Formats a date string into a "time ago" format.
 * Examples: "Vừa mới xong", "5 phút trước", "2 giờ trước", "1 ngày trước"
 */
export const formatTimeAgo = (dateLink: string | Date): string => {
  if (!dateLink) return 'Không rõ';

  const date = new Date(dateLink);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa mới cập nhật';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
};

/**
 * Checks if a user is "online" based on their last location update.
 * Threshold: 5 minutes.
 */
export const isUserOnline = (lastLocationAt?: string | Date, thresholdMinutes = 5): boolean => {
  if (!lastLocationAt) return false;
  const date = new Date(lastLocationAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / 1000 / 60;
  return diffInMinutes <= thresholdMinutes;
};

import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const FeedbackUtils = {
  /**
   * Plays the system default notification sound immediately.
   * Note: This uses a local notification with empty content to trigger the sound.
   */
  playSiren: async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'CẢNH BÁO KHẨN CẤP',
          body: 'Yêu cầu cứu trợ mới gần bạn!',
          sound: 'default', // Uses system default notification sound
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.warn('Error playing system sound:', error);
    }
  },

  stopSiren: async () => {
    // System sound is short and stops automatically.
    // We can dismiss the notification to clean up.
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.warn('Error dismissing notifications:', error);
    }
  },

  vibrateEmergency: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 500);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 500);
    }
  },

  vibrateSuccess: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  vibrateSelection: () => {
    Haptics.selectionAsync();
  }
};

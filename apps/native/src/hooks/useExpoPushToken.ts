import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { apiService } from '@/services/api.service';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: false }),

});

export const useExpoPushToken = () => {
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) apiService.put('/shared/user/push-token/update', { token }).catch(console.error);
    });
  }, []);
};

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    // Kênh SOS - Rung mạnh + Max Importance
    await Notifications.setNotificationChannelAsync('sos', {
      name: 'SOS Alert',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true, // Thử bypass Do Not Disturb (Yêu cầu quyền)
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}
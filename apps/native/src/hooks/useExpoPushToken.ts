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
      name: 'default', importance: Notifications.AndroidImportance.MAX,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}
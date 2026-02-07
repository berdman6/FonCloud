import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

export async function scheduleDeviceSoldNotifications(deviceModel: string, brand: string) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const delays = [5, 19, 31];
  
  for (const minutes of delays) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FonCloud',
        body: `${brand} ${deviceModel} sold out! / ${brand} ${deviceModel} বিক্রি হয়ে গেছে!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
      },
    });
  }
}

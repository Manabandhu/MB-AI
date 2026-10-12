import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { persistentStorage } from '@/lib/persistentStorage';
import { registerPushDevice, removePushDevice } from './api';
import { routeForPushData } from './pushRoutes';

const TOKEN_KEY = 'push.expoToken';

export type PushResult =
  | { status: 'registered' }
  | { status: 'denied' }
  | { status: 'unsupported'; reason: string };

type NotificationsModule = typeof import('expo-notifications');

/**
 * Expo Go dropped remote push in SDK 53 and warns as soon as `expo-notifications` is imported, so the module is
 * loaded lazily and only where push can work (development and store builds on iOS/Android).
 */
const pushAvailable =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let notificationsModule: Promise<NotificationsModule> | null = null;

function loadNotifications(): Promise<NotificationsModule> {
  if (!notificationsModule) {
    notificationsModule = import('expo-notifications').then((Notifications) => {
      // Show pushes as banners while the app is open too; the inbox badge refreshes on its own.
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return Notifications;
    });
  }
  return notificationsModule;
}

if (pushAvailable) void loadNotifications();

/**
 * Asks the OS for permission (only when the member turns push on) and registers this device's Expo token with the
 * backend. Never claims success it did not get: web, simulators, a missing EAS project id, and a denied prompt
 * each come back as their own status for the screen to explain.
 */
export async function requestPermissionAndRegister(): Promise<PushResult> {
  if (Platform.OS === 'web')
    return { status: 'unsupported', reason: 'Push notifications are available in the mobile app.' };
  if (!pushAvailable)
    return {
      status: 'unsupported',
      reason: 'Push notifications need the ManaBandhu app; Expo Go cannot receive them.',
    };
  if (!Device.isDevice)
    return { status: 'unsupported', reason: 'Push notifications need a physical device.' };
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId)
    return { status: 'unsupported', reason: 'Push is not configured for this build yet.' };

  const Notifications = await loadNotifications();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ManaBandhu',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return { status: 'denied' };

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerPushDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
  await persistentStorage.setItem(TOKEN_KEY, token);
  return { status: 'registered' };
}

/** Removes this device's token from the caller's account (sign-out or push turned off). Best effort. */
export async function unregisterThisDevice(): Promise<void> {
  if (Platform.OS === 'web') return;
  const token = await persistentStorage.getItem(TOKEN_KEY);
  if (!token) return;
  try {
    await removePushDevice(token);
  } finally {
    await persistentStorage.removeItem(TOKEN_KEY);
  }
}

export function useOpenPushTaps(open: (route: string) => void) {
  useEffect(() => {
    if (!pushAvailable) return;
    let active = true;
    let subscription: { remove: () => void } | undefined;
    void loadNotifications().then((Notifications) => {
      if (!active) return;
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const route = routeForPushData(response.notification.request.content.data);
        if (route) open(route);
      });
    });
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [open]);
}

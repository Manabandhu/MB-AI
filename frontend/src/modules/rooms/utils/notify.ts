import { Alert, Platform } from 'react-native';

/**
 * React Native Web's `Alert.alert` does nothing, so failures shown with it would be silent on the web app. These
 * helpers use the browser dialogs there and the native alert everywhere else.
 */
export function showError(title: string, error: unknown, fallback = 'Please try again.') {
  const message = error instanceof Error && error.message ? error.message : fallback;
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Resolves true when the person confirms. */
export function confirmAction(title: string, message: string, confirmLabel: string) {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

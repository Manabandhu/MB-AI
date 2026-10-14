import { Alert, Platform } from 'react-native';

/**
 * App-wide alerts and confirmations. React Native Web's `Alert.alert` does nothing, so failures shown with it
 * would be silent on the web app; these helpers use the browser dialogs there and the native alert elsewhere.
 * Confirmations go through the in-app `ConfirmSheet` once `ConfirmProvider` (mounted in `app/_layout.tsx`) has
 * registered itself, and fall back to the platform dialog otherwise.
 */

export type ConfirmOptions = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button. Only for delete, cancel, and remove actions. */
  destructive?: boolean;
};

type ConfirmHandler = (options: ConfirmOptions) => Promise<boolean>;

let confirmHandler: ConfirmHandler | null = null;

/** Called by `ConfirmProvider`; pass `null` on unmount. */
export function registerConfirmHandler(handler: ConfirmHandler | null) {
  confirmHandler = handler;
}

/** The message to show for a failure: a string as is, an `Error`'s message, or `fallback`. */
export function errorText(error: unknown, fallback = 'Please try again.') {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Shows a failure. `error` may be a message string or the caught error. */
export function showError(title: string, error: unknown, fallback = 'Please try again.') {
  showMessage(title, errorText(error, fallback));
}

/** Platform dialog used when no `ConfirmProvider` is mounted. Resolves true when the person confirms. */
export function platformConfirm({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions) {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${body}`) ?? false);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      body,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Asks for confirmation in the app's confirm sheet. Resolves true when the person confirms. */
export function confirm(options: ConfirmOptions) {
  return confirmHandler ? confirmHandler(options) : platformConfirm(options);
}

/** Positional form kept for existing callers. `destructive` defaults to false. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  options: { destructive?: boolean; cancelLabel?: string } = {},
) {
  return confirm({ title, body: message, confirmLabel, ...options });
}

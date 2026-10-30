import { useState } from 'react';
import { Platform } from 'react-native';
import { YStack } from 'tamagui';
import { requestPermissionAndRegister, unregisterThisDevice } from '@/modules/notifications/push';
import { AppText } from '@/modules/shared/ui/AppText';
import { SettingRow } from './SettingRow';

type Props = {
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

/**
 * Push for the whole account plus this device. Turning it on asks the OS for permission and registers this
 * device; the setting is saved only when that works, and the reason is shown when it does not.
 */
export function PushSection({ value, disabled, onChange }: Props) {
  const [note, setNote] = useState<string | null>(
    Platform.OS === 'web' ? 'Push notifications are delivered to the ManaBandhu mobile app.' : null,
  );
  const [busy, setBusy] = useState(false);

  const toggle = async (next: boolean) => {
    setBusy(true);
    setNote(null);
    try {
      if (next && Platform.OS !== 'web') {
        const result = await requestPermissionAndRegister();
        if (result.status === 'denied') {
          setNote(
            'Notifications are blocked for ManaBandhu in your phone settings. Allow them there, then try again.',
          );
          return;
        }
        if (result.status === 'unsupported') setNote(result.reason);
      }
      if (!next) await unregisterThisDevice().catch(() => undefined);
      onChange(next);
    } catch {
      setNote('Could not turn on push for this device. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <YStack gap="$x1">
      <SettingRow
        description="Alerts on this phone, even when the app is closed"
        disabled={disabled || busy}
        icon="bell"
        onChange={toggle}
        title="Push notifications"
        value={value}
      />
      {note ? (
        <AppText role="alert" tone="muted" variant="caption">
          {note}
        </AppText>
      ) : null}
    </YStack>
  );
}

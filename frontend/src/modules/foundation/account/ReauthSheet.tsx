import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { TextField } from '@/modules/shared/ui/TextField';
import { reauthWithPassword, sendReauthCode, verifyReauthCode } from './reauth';

type Props = {
  visible: boolean;
  /** What the member is confirming, shown in the sheet ("delete your account"). */
  purpose: string;
  onClose: () => void;
  onConfirmed: () => void;
};

/** Asks the member to prove it is them: their password, or a one-time code sent to their email or phone. */
export function ReauthSheet({ visible, purpose, onClose, onConfirmed }: Props) {
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? null;
  const phone = user?.phone || null;
  const [mode, setMode] = useState<'password' | 'code'>(email ? 'password' : 'code');
  const [value, setValue] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMode(email ? 'password' : 'code');
      setValue('');
      setCodeSent(false);
      setError(null);
    }
  }, [visible, email]);

  const run = async (action: () => Promise<void>, after?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      after?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = () =>
    run(
      () =>
        mode === 'password' && email
          ? reauthWithPassword(email, value)
          : verifyReauthCode({ email, phone }, value.trim()),
      onConfirmed,
    );

  return (
    <BottomSheet
      onClose={onClose}
      subtitle={`To ${purpose}, confirm it's you.`}
      title="Confirm it's you"
      visible={visible}
    >
      <YStack gap="$x4" paddingBottom="$x2">
        {mode === 'password' ? (
          <TextField
            autoComplete="current-password"
            autoFocus
            error={error}
            label="Password"
            onChangeText={setValue}
            onSubmitEditing={confirm}
            secureTextEntry
            value={value}
          />
        ) : codeSent ? (
          <TextField
            autoComplete="one-time-code"
            autoFocus
            error={error}
            helper={`We sent a code to ${email ?? phone}.`}
            keyboardType="number-pad"
            label="Code"
            maxLength={8}
            onChangeText={setValue}
            onSubmitEditing={confirm}
            value={value}
          />
        ) : (
          <YStack gap="$x2">
            <AppText tone="muted" variant="body">
              We'll send a one-time code to {email ?? phone}.
            </AppText>
            {error ? (
              <AppText role="alert" tone="danger" variant="caption">
                {error}
              </AppText>
            ) : null}
          </YStack>
        )}
        {mode === 'code' && !codeSent ? (
          <AppButton
            fullWidth
            label="Send code"
            loading={busy}
            onPress={() =>
              run(
                () => sendReauthCode({ email, phone }),
                () => setCodeSent(true),
              )
            }
          />
        ) : (
          <AppButton disabled={!value} fullWidth label="Confirm" loading={busy} onPress={confirm} />
        )}
        {email && mode === 'password' ? (
          <AppButton
            label="Use a one-time code instead"
            onPress={() => {
              setMode('code');
              setValue('');
              setError(null);
            }}
            variant="ghost"
          />
        ) : null}
      </YStack>
    </BottomSheet>
  );
}

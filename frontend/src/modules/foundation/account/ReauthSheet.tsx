import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { OTP_CODE_LENGTH } from '@/modules/auth/authHelpers';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { TextField } from '@/modules/shared/ui/TextField';
import { reauthWithPassword, sendReauthCode, verifyReauthCode } from './reauth';

/** Wait before another code can be requested (Supabase rate-limits OTP sends). */
const RESEND_SECONDS = 30;

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
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const resend = async () => {
    setResending(true);
    setError(null);
    try {
      await sendReauthCode({ email, phone });
      setValue('');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send a new code.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setMode(email ? 'password' : 'code');
      setValue('');
      setCodeSent(false);
      setError(null);
      setResendIn(0);
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
            maxLength={OTP_CODE_LENGTH}
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
                () => {
                  setCodeSent(true);
                  setResendIn(RESEND_SECONDS);
                },
              )
            }
          />
        ) : (
          <AppButton disabled={!value} fullWidth label="Confirm" loading={busy} onPress={confirm} />
        )}
        {mode === 'code' && codeSent ? (
          <AppButton
            disabled={busy || resendIn > 0}
            label={resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
            loading={resending}
            onPress={resend}
            variant="ghost"
          />
        ) : null}
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

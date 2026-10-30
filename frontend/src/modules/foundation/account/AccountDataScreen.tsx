import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share } from 'react-native';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import { unregisterThisDevice } from '@/modules/notifications';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { TextField } from '@/modules/shared/ui/TextField';
import { deleteMyAccount, exportMyData, ReauthRequiredError } from './api';
import { ReauthSheet } from './ReauthSheet';
import { confirmPhoneChange, requestContactChange } from './reauth';

type Pending =
  | { kind: 'delete' }
  | { kind: 'email'; value: string }
  | { kind: 'phone'; value: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+[1-9]\d{7,14}$/;
const PHONE_CODE = /^\d{4,10}$/;

async function saveExport(data: unknown) {
  const json = JSON.stringify(data, null, 2);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'manabandhu-data.json';
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: 'ManaBandhu data export', message: json });
}

/** Sign-in details, data export, and account deletion. Every sensitive change asks the member to confirm first. */
export function AccountDataScreen() {
  const user = useAuthStore((s) => s.user);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reauthOpen, setReauthOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [phoneToConfirm, setPhoneToConfirm] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'export' | 'delete' | 'contact' | 'phone-code' | null>(null);

  const exportData = async () => {
    setBusy('export');
    setError(null);
    try {
      await saveExport(await exportMyData());
      setNotice('Your data export is ready.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export your data.');
    } finally {
      setBusy(null);
    }
  };

  const finishDeletion = async () => {
    await unregisterThisDevice().catch(() => undefined);
    try {
      await useAuthStore.getState().signOut();
    } catch {
      // The account no longer exists, so the server may refuse the sign-out; clear the stored session locally
      // too, otherwise the next launch would restore the deleted account's session.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      useAuthStore.setState({
        session: null,
        user: null,
        identity: null,
        status: 'unauthenticated',
      });
      router.replace('/welcome');
    }
  };

  const runPending = async (action: Pending) => {
    setError(null);
    if (action.kind === 'delete') {
      setBusy('delete');
      try {
        await deleteMyAccount();
        await finishDeletion();
      } catch (err) {
        if (err instanceof ReauthRequiredError) {
          setPending(action);
          setReauthOpen(true);
        } else {
          setError(err instanceof Error ? err.message : 'Your account could not be deleted.');
        }
      } finally {
        setBusy(null);
      }
      return;
    }
    setBusy('contact');
    try {
      await requestContactChange(
        action.kind === 'email' ? { email: action.value } : { phone: action.value },
      );
      setNotice(
        action.kind === 'email'
          ? `Confirm the change from the links sent to ${action.value} and to your current email. Your current email works until then.`
          : `We sent a code to ${action.value}. Enter it below to finish the change.`,
      );
      if (action.kind === 'phone') {
        setPhoneToConfirm(action.value);
        setPhoneCode('');
      }
      setNewEmail('');
      setNewPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the change.');
    } finally {
      setBusy(null);
    }
  };

  const confirmPhone = async () => {
    const code = phoneCode.trim();
    if (!phoneToConfirm || !PHONE_CODE.test(code)) return;
    setBusy('phone-code');
    setError(null);
    try {
      await confirmPhoneChange(phoneToConfirm, code);
      setNotice(`Your phone number is now ${phoneToConfirm}.`);
      setPhoneToConfirm(null);
      setPhoneCode('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'That code did not work. Check it and try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const startWithReauth = (action: Pending) => {
    setPending(action);
    setReauthOpen(true);
  };

  return (
    <Screen>
      <YStack gap="$x5">
        <BackButton fallback="/settings" />
        <AppText role="heading" variant="h2">
          Account & data
        </AppText>
        {notice ? (
          <AppText role="status" tone="primary" variant="body">
            {notice}
          </AppText>
        ) : null}
        {error ? (
          <AppText role="alert" tone="danger" variant="body">
            {error}
          </AppText>
        ) : null}

        <Section title="Sign-in details">
          <Card padding="$x4">
            <YStack gap="$x3">
              <AppText variant="body">Email: {user?.email || 'Not set'}</AppText>
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                label="New email"
                onChangeText={setNewEmail}
                value={newEmail}
              />
              <AppButton
                disabled={!EMAIL.test(newEmail.trim())}
                label="Change email"
                loading={busy === 'contact' && pending?.kind === 'email'}
                onPress={() =>
                  startWithReauth({ kind: 'email', value: newEmail.trim().toLowerCase() })
                }
                size="sm"
                variant="secondary"
              />
              <AppText variant="body">Phone: {user?.phone || 'Not set'}</AppText>
              <TextField
                autoComplete="tel"
                helper="International format, for example +14695550123"
                keyboardType="phone-pad"
                label="New phone number"
                onChangeText={setNewPhone}
                value={newPhone}
              />
              <AppButton
                disabled={!PHONE.test(newPhone.trim())}
                label="Change phone number"
                loading={busy === 'contact' && pending?.kind === 'phone'}
                onPress={() => startWithReauth({ kind: 'phone', value: newPhone.trim() })}
                size="sm"
                variant="secondary"
              />
              {phoneToConfirm ? (
                <YStack gap="$x2">
                  <TextField
                    autoComplete="one-time-code"
                    helper={`Code sent to ${phoneToConfirm}`}
                    keyboardType="number-pad"
                    label="Confirmation code"
                    onChangeText={setPhoneCode}
                    value={phoneCode}
                  />
                  <AppButton
                    disabled={!PHONE_CODE.test(phoneCode.trim())}
                    label="Confirm new number"
                    loading={busy === 'phone-code'}
                    onPress={confirmPhone}
                    size="sm"
                  />
                </YStack>
              ) : null}
            </YStack>
          </Card>
        </Section>

        <Section title="Your data">
          <Card padding="$x4">
            <YStack gap="$x3">
              <AppText tone="muted" variant="body">
                Download a copy of everything stored against your account.
              </AppText>
              <AppButton
                icon="share"
                label="Download my data"
                loading={busy === 'export'}
                onPress={exportData}
              />
            </YStack>
          </Card>
        </Section>

        <Section title="Legal">
          <YStack gap="$x2">
            <ListRow href="/terms" icon="shield" title="Terms of Service" />
            <ListRow href="/privacy" icon="shield" title="Privacy Policy" />
          </YStack>
        </Section>

        <Section title="Delete account">
          <Card padding="$x4">
            <YStack gap="$x3">
              <AppText variant="body">
                Deleting removes your account, your listings, rides, posts, messages and everything
                else you created. Shared expense groups you own pass to another member. This cannot
                be undone.
              </AppText>
              {busy === 'delete' ? (
                <AppText aria-live="polite" role="status" tone="muted" variant="body">
                  Deleting your account. This can take a few seconds; keep this screen open.
                </AppText>
              ) : null}
              {error && pending?.kind === 'delete' ? (
                <AppText role="alert" tone="danger" variant="body">
                  {error}
                </AppText>
              ) : null}
              <AppButton
                disabled={busy !== null && busy !== 'delete'}
                label={busy === 'delete' ? 'Deleting your account…' : 'Delete my account'}
                loading={busy === 'delete'}
                onPress={() => setDeleteOpen(true)}
                variant="danger"
              />
            </YStack>
          </Card>
        </Section>
      </YStack>

      <BottomSheet
        onClose={() => setDeleteOpen(false)}
        subtitle="Type DELETE to confirm. You will be asked to confirm it's you."
        title="Delete your account?"
        visible={deleteOpen}
      >
        <YStack gap="$x4" paddingBottom="$x2">
          <TextField
            autoCapitalize="characters"
            label="Type DELETE"
            onChangeText={setConfirmText}
            value={confirmText}
          />
          <AppButton
            disabled={confirmText.trim() !== 'DELETE'}
            fullWidth
            label="Delete account permanently"
            loading={busy === 'delete'}
            onPress={() => {
              setDeleteOpen(false);
              setConfirmText('');
              startWithReauth({ kind: 'delete' });
            }}
            variant="danger"
          />
        </YStack>
      </BottomSheet>

      <ReauthSheet
        onClose={() => setReauthOpen(false)}
        onConfirmed={() => {
          setReauthOpen(false);
          if (pending) void runPending(pending);
        }}
        purpose={pending?.kind === 'delete' ? 'delete your account' : 'change your sign-in details'}
        visible={reauthOpen}
      />
    </Screen>
  );
}

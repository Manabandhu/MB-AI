import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { TextField } from '@/modules/shared/ui/TextField';
import { preferredName, validateNickname } from './greetingName';

/** Lets the member set the short name we greet them with. Saved to their account; errors stay visible. */
export function NicknameSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const updateNickname = useAuthStore((s) => s.updateNickname);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const existing = user?.user_metadata?.nickname;
      // Pre-fill only a real nickname or a first name short enough to keep; never a too-long name.
      const candidate =
        typeof existing === 'string' ? existing : (preferredName(user?.user_metadata) ?? '');
      setValue(validateNickname(candidate).ok ? candidate : '');
      setError(null);
    }
  }, [visible, user]);

  const save = async () => {
    const result = validateNickname(value);
    if (!result.ok) {
      setError(t(`nickname.${result.error}`));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateNickname(result.value);
      onClose();
    } catch {
      setError(t('nickname.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      onClose={onClose}
      subtitle={t('nickname.promptBody')}
      title={t('nickname.title')}
      visible={visible}
    >
      <YStack gap="$x4" paddingBottom="$x2">
        <TextField
          autoCapitalize="words"
          autoFocus
          error={error}
          label={t('nickname.label')}
          maxLength={24}
          onChangeText={setValue}
          onSubmitEditing={save}
          placeholder={t('nickname.placeholder')}
          returnKeyType="done"
          value={value}
        />
        <AppButton fullWidth label={t('nickname.save')} loading={saving} onPress={save} size="lg" />
      </YStack>
    </BottomSheet>
  );
}

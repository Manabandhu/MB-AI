import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useAppearance } from '@/theme/ThemeProvider';
import { useAppearanceStore } from '@/theme/themePreferenceStore';

/** Shown when the name does not fit beside the greeting (or there is none). "Not now" hides it on this device. */
export function NicknameNudge({ onSet }: { onSet: () => void }) {
  const t = useT();
  const { palette } = useAppearance();
  const dismiss = useAppearanceStore((s) => s.dismissNicknamePrompt);
  return (
    <Card padding="$x3" variant="tinted">
      <XStack alignItems="center" flexWrap="wrap" gap="$x3">
        <AppIcon color={palette.primary} name="user" size={20} />
        <YStack flex={1} minWidth={160}>
          <AppText variant="bodyStrong">{t('nickname.prompt')}</AppText>
          <AppText tone="muted" variant="caption">
            {t('nickname.promptBody')}
          </AppText>
        </YStack>
        <XStack gap="$x2">
          <AppButton label={t('nickname.notNow')} onPress={dismiss} size="sm" variant="ghost" />
          <AppButton label={t('nickname.set')} onPress={onSet} size="sm" />
        </XStack>
      </XStack>
    </Card>
  );
}

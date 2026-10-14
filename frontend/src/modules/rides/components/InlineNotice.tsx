import { type Href, router } from 'expo-router';
import { XStack } from 'tamagui';
import type { TimedNotice } from '@/modules/rides/hooks/useTimedNotice';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

/**
 * A one-line success notice rendered beside the action that produced it (see `useTimedNotice`). Announced
 * politely to screen readers; the check icon and text carry the meaning, not colour alone.
 */
export function InlineNotice({ notice }: { notice: TimedNotice | null }) {
  const { palette } = useAppearance();
  if (!notice) return null;
  return (
    <XStack
      alignItems="center"
      aria-live="polite"
      backgroundColor="$successBg"
      borderRadius="$control"
      flexWrap="wrap"
      gap="$x2"
      paddingHorizontal="$x3"
      paddingVertical="$x2"
      role="status"
    >
      <AppIcon color={palette.success} name="check" size={16} />
      <AppText flex={1} minWidth={160} variant="label">
        {notice.text}
      </AppText>
      {notice.href ? (
        <AppButton
          label={notice.hrefLabel ?? 'View'}
          onPress={() => router.push(notice.href as Href)}
          size="sm"
          variant="ghost"
        />
      ) : null}
    </XStack>
  );
}

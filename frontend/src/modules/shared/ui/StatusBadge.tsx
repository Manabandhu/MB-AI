import { XStack, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { useAppearance } from '@/theme/ThemeProvider';

export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Pastel background plus the palette key for the dot/icon. Text stays in the body colour for AA contrast. */
const tones = {
  neutral: { bg: '$surfaceContainerHigh', key: 'muted' },
  primary: { bg: '$primarySoft', key: 'primary' },
  success: { bg: '$successBg', key: 'success' },
  warning: { bg: '$goldBg', key: 'goldText' },
  danger: { bg: '$errorBg', key: 'error' },
  info: { bg: '$infoBg', key: 'info' },
} as const;

type StatusBadgeProps = { label: string; tone?: StatusTone; icon?: AppIconName };

/**
 * Read-only status pill (Active, Reserved, Cancelled…). Colour is never the only signal: the label is always
 * shown, with a tone-coloured dot or icon. Use this for statuses instead of a selected `Chip`.
 */
export function StatusBadge({ label, tone = 'neutral', icon }: StatusBadgeProps) {
  const { palette } = useAppearance();
  const t = tones[tone];
  const accent = palette[t.key];
  return (
    <XStack
      aria-label={`Status: ${label}`}
      alignItems="center"
      alignSelf="flex-start"
      backgroundColor={t.bg}
      borderRadius="$pill"
      gap={6}
      minHeight={24}
      paddingHorizontal="$x2"
      paddingVertical={2}
    >
      {icon ? (
        <AppIcon color={accent} name={icon} size={14} />
      ) : (
        <YStack backgroundColor={accent} borderRadius="$pill" height={6} width={6} />
      )}
      <AppText numberOfLines={1} variant="caption">
        {label}
      </AppText>
    </XStack>
  );
}

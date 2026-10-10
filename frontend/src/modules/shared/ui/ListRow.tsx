import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useAppearance } from '@/theme/ThemeProvider';

type Tone = 'primary' | 'teal' | 'warm' | 'danger';

type ListRowProps = {
  title: string;
  /** Second line: location, author, company… */
  subtitle?: string | null;
  /** Small trailing text such as a price or date. */
  meta?: string | null;
  icon: AppIconName;
  tone?: Tone;
  href: string;
  /** Optional element under the subtitle (chips, badges). */
  footer?: ReactNode;
};

const toneTokens = {
  primary: { bg: '$primaryTint', key: 'primary' },
  teal: { bg: '$tealTint', key: 'teal' },
  warm: { bg: '$warmTint', key: 'warm' },
  danger: { bg: '$warmTint', key: 'error' },
} as const;

/** The standard tappable row for listings across modules: tinted icon, two lines of text, trailing meta. */
export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  tone = 'primary',
  href,
  footer,
}: ListRowProps) {
  const { palette } = useAppearance();
  const t = toneTokens[tone];
  return (
    <Card aria-label={[title, subtitle, meta].filter(Boolean).join(', ')} href={href} padding="$x3">
      <XStack alignItems="center" gap="$x3">
        <YStack
          alignItems="center"
          backgroundColor={t.bg}
          borderRadius="$control"
          height={44}
          justifyContent="center"
          width={44}
        >
          <AppIcon color={palette[t.key]} name={icon} size={20} />
        </YStack>
        <YStack flex={1} gap={2}>
          <AppText numberOfLines={1} variant="bodyStrong">
            {title}
          </AppText>
          {subtitle ? (
            <AppText numberOfLines={1} tone="muted" variant="caption">
              {subtitle}
            </AppText>
          ) : null}
          {footer}
        </YStack>
        {meta ? (
          <AppText color={palette[t.key]} numberOfLines={1} variant="label">
            {meta}
          </AppText>
        ) : null}
      </XStack>
    </Card>
  );
}

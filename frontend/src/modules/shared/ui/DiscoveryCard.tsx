import { XStack, YStack } from 'tamagui';
import { useAppearance } from '@/theme/ThemeProvider';
import { AppIcon, type AppIconName } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import type { DiscoveryKind } from './DiscoveryArtwork';

const destinationIcons: Record<DiscoveryKind, AppIconName> = {
  rooms: 'bed',
  rides: 'car',
  jobs: 'briefcase',
  community: 'community',
  events: 'calendar',
  marketplace: 'marketplace',
  referrals: 'handshake',
  expenses: 'receipt',
  essentials: 'compass',
  connection: 'community',
};

/** One quiet navigation target, with a readable label and optional supporting text. */
export function DiscoveryCard({
  title,
  description,
  href,
  kind,
  onPress,
  compact = false,
}: {
  title: string;
  description: string;
  href: string;
  kind: DiscoveryKind;
  onPress?: () => void;
  compact?: boolean;
}) {
  const { palette } = useAppearance();
  return (
    <Card
      aria-label={`${title}. ${description}`}
      href={href}
      onPress={onPress}
      padding={compact ? '$x4' : '$x5'}
      gap="$x4"
      flexGrow={1}
      backgroundColor="$surface"
      minHeight={compact ? 108 : 152}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <AppIcon name={destinationIcons[kind]} size={24} color={palette.ink} />
        {!compact ? <AppIcon name="arrow-right" size={18} color={palette.muted} /> : null}
      </XStack>
      <YStack gap="$x2">
        <AppText variant={compact ? 'label' : 'h4'}>{title}</AppText>
        {!compact ? (
          <AppText tone="muted" variant="caption">
            {description}
          </AppText>
        ) : null}
      </YStack>
    </Card>
  );
}

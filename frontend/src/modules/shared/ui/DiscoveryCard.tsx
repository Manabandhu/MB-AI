import { XStack, YStack } from 'tamagui';
import { useAppearance } from '@/theme/ThemeProvider';
import { AppIcon, type AppIconName } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import type { DiscoveryKind } from './DiscoveryArtwork';

const icons: Record<DiscoveryKind, AppIconName> = {
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
      padding="$x4"
      borderWidth={0}
      borderRadius="$control"
      backgroundColor="transparent"
      hoverStyle={{ backgroundColor: '$surfaceContainerLow' }}
    >
      <XStack gap="$x4" alignItems="center">
        <YStack
          width={48}
          height={48}
          borderRadius="$control"
          backgroundColor="$surfaceContainerLow"
          alignItems="center"
          justifyContent="center"
        >
          <AppIcon name={icons[kind]} color={palette.ink} size={22} />
        </YStack>
        <YStack flex={1} minWidth={0} gap="$x1">
          <AppText variant="bodyStrong">{title}</AppText>
          {!compact ? (
            <AppText tone="muted" variant="caption">
              {description}
            </AppText>
          ) : null}
        </YStack>
        <AppIcon name="arrow-right" color={palette.muted} size={18} />
      </XStack>
    </Card>
  );
}

import { XStack, YStack } from 'tamagui';
import { useAppearance } from '@/theme/ThemeProvider';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import { DiscoveryArtwork, type DiscoveryKind } from './DiscoveryArtwork';

const artSurface = {
  rooms: '$artViolet',
  rides: '$artMint',
  jobs: '$artPeach',
  community: '$artBlue',
  events: '$artPeach',
  marketplace: '$artPeach',
  referrals: '$artViolet',
  expenses: '$artMint',
  essentials: '$artBlue',
  connection: '$artViolet',
} as const;

/** A visual destination, with real module text and one whole-card navigation target. */
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
      padding={0}
      gap={0}
      flexGrow={1}
      borderWidth={compact ? 0 : 1}
      backgroundColor={compact ? 'transparent' : '$surface'}
      overflow="hidden"
    >
      <YStack backgroundColor={artSurface[kind]} borderRadius={compact ? '$card' : 0}>
        <DiscoveryArtwork kind={kind} height={compact ? 88 : 124} />
      </YStack>
      {compact ? (
        <AppText textAlign="center" variant="label" paddingTop="$x2" paddingBottom="$x1">
          {title}
        </AppText>
      ) : (
        <YStack gap="$x2" padding="$x4">
          <XStack alignItems="center" gap="$x2">
            <AppText variant="h4" flex={1}>
              {title}
            </AppText>
            <AppIcon color={palette.muted} name="arrow-right" size={18} />
          </XStack>
          <AppText tone="muted" variant="caption">
            {description}
          </AppText>
        </YStack>
      )}
    </Card>
  );
}

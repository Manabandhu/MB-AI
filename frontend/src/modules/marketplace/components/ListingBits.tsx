import { Image } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import type { MarketplaceListing } from '../types';
import { formatListingPrice } from '../utils/format';
import { statusIs, statusLabel } from '../utils/listingRules';

/** Reserved / Sold / Removed badge. Renders nothing for active listings unless `showActive`. */
export function StatusBadge({ status, showActive }: { status: string; showActive?: boolean }) {
  if (statusIs(status, 'active') && !showActive) return null;
  const background = statusIs(status, 'active')
    ? '$successBg'
    : statusIs(status, 'reserved')
      ? '$warmBg'
      : statusIs(status, 'removed')
        ? '$warmTint'
        : '$surfaceContainerHigh';
  return (
    <XStack
      alignSelf="flex-start"
      backgroundColor={background}
      borderRadius="$pill"
      paddingHorizontal="$x2"
      paddingVertical={2}
    >
      <AppText variant="caption">{statusLabel(status)}</AppText>
    </XStack>
  );
}

/** 44pt save toggle; exposes its on/off state to assistive tech. */
export function SaveToggle({
  saved,
  onPress,
  title,
}: {
  saved: boolean;
  onPress: () => void;
  title?: string;
}) {
  const theme = useTheme();
  return (
    <YStack
      alignItems="center"
      aria-checked={saved}
      aria-label={title ? `Save ${title}` : 'Save listing'}
      backgroundColor={saved ? '$primary' : '$surface'}
      borderColor={saved ? '$primary' : '$borderColor'}
      borderRadius="$pill"
      borderWidth={1}
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      height="$touch"
      justifyContent="center"
      onPress={onPress}
      pressStyle={{ opacity: 0.8 }}
      role="switch"
      width="$touch"
    >
      <AppIcon color={saved ? theme.onPrimary?.val : theme.primary?.val} name="heart" size={20} />
    </YStack>
  );
}

export function PhotoPlaceholder({ height, label }: { height: number; label?: string }) {
  const theme = useTheme();
  return (
    <YStack
      alignItems="center"
      backgroundColor="$surfaceContainerLow"
      gap="$x1"
      height={height}
      justifyContent="center"
      width="100%"
    >
      <AppIcon color={theme.colorMuted?.val} name="package" size={32} />
      {label ? (
        <AppText tone="muted" variant="caption">
          {label}
        </AppText>
      ) : null}
    </YStack>
  );
}

const CARD_IMAGE_HEIGHT = 150;

/** Grid card: cover photo (or a neutral placeholder), price with cents, condition, and status. */
export function ListingCard({
  listing,
  saved,
  onToggleSave,
  onPress,
}: {
  listing: MarketplaceListing;
  saved: boolean;
  /** Omit to hide the heart (own listings). */
  onToggleSave?: () => void;
  onPress: () => void;
}) {
  const price = formatListingPrice(listing.price, listing.currency);
  return (
    <YStack position="relative">
      <Card
        aria-label={`${listing.title}, ${price}${statusIs(listing.status, 'active') ? '' : `, ${statusLabel(listing.status)}`}`}
        gap={0}
        onPress={onPress}
        overflow="hidden"
        padding={0}
      >
        {listing.coverImageUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={{ uri: listing.coverImageUrl }}
            style={{ width: '100%', height: CARD_IMAGE_HEIGHT }}
          />
        ) : (
          <PhotoPlaceholder height={CARD_IMAGE_HEIGHT} label="No photo" />
        )}
        <YStack gap="$x1" padding="$x3">
          <AppText tone="primary" variant="bodyStrong">
            {price}
          </AppText>
          <AppText numberOfLines={2} variant="label">
            {listing.title}
          </AppText>
          {listing.location ? (
            <XStack alignItems="center" gap="$x1">
              <AppIcon name="map-pin" size={12} />
              <AppText flex={1} numberOfLines={1} tone="muted" variant="caption">
                {listing.location}
              </AppText>
            </XStack>
          ) : null}
          <XStack flexWrap="wrap" gap="$x1">
            {listing.condition ? (
              <AppText tone="muted" variant="caption">
                {listing.condition}
                {listing.negotiable ? ' · Negotiable' : ''}
              </AppText>
            ) : listing.negotiable ? (
              <AppText tone="muted" variant="caption">
                Negotiable
              </AppText>
            ) : null}
          </XStack>
          <StatusBadge status={listing.status} />
        </YStack>
      </Card>
      {onToggleSave ? (
        <YStack position="absolute" right={6} top={6}>
          <SaveToggle onPress={onToggleSave} saved={saved} title={listing.title} />
        </YStack>
      ) : null}
    </YStack>
  );
}

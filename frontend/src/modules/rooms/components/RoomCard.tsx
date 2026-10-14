import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useTheme, XStack, YStack } from 'tamagui';
import type { RoomListing } from '@/modules/rooms/types';
import { isFurnished, isPrivateBath, isPureVeg } from '@/modules/rooms/utils/roomFilters';
import { formatRent } from '@/modules/rooms/utils/roomFormat';
import { genderLabel } from '@/modules/rooms/utils/roomLabels';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

const PHOTO_HEIGHT = 168;
const MAX_TAGS = 4;
const focusRing = {
  outlineWidth: 3,
  outlineStyle: 'solid',
  outlineColor: '$outlineColor',
} as const;

/** Read-only tags from the listing's structured fields (never guessed from the title). */
export function roomTags(room: RoomListing): string[] {
  const tags = [room.roomType];
  if (isPureVeg(room)) tags.push('Pure veg');
  if (isPrivateBath(room)) tags.push('Private bath');
  if (isFurnished(room)) tags.push('Furnished');
  const gender = (room.genderPreference ?? '').toUpperCase();
  if (gender === 'FEMALE_ONLY' || gender === 'MALE_ONLY') {
    tags.push(genderLabel(gender) ?? gender);
  }
  if (room.utilitiesIncluded) tags.push('Utilities included');
  return tags.filter(Boolean);
}

/**
 * Photo-first room card (like the marketplace listing card): cover photo or a neutral placeholder, rent, title, area,
 * and tags. The heart saves the room for everyone except its owner. The whole card opens the listing.
 */
export function RoomCard({
  room,
  saved,
  onToggleSave,
}: {
  room: RoomListing;
  saved: boolean;
  /** Omit to hide the heart (own listings). */
  onToggleSave?: () => void;
}) {
  const theme = useTheme();
  const rent = formatRent(room.price);
  const tags = roomTags(room);
  return (
    <YStack position="relative">
      <Card
        aria-label={`${room.title}, ${rent}${room.broadLocation ? `, ${room.broadLocation}` : ''}`}
        gap={0}
        href={`/rooms/${room.id}` as Href}
        overflow="hidden"
        padding={0}
      >
        {room.coverImageUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: room.coverImageUrl }}
            style={{ width: '100%', height: PHOTO_HEIGHT }}
          />
        ) : (
          <YStack
            alignItems="center"
            backgroundColor="$surfaceContainerLow"
            gap="$x1"
            height={PHOTO_HEIGHT}
            justifyContent="center"
          >
            <AppIcon color={theme.colorMuted?.val} name="bed" size={32} />
            <AppText tone="muted" variant="caption">
              No photo yet
            </AppText>
          </YStack>
        )}
        <YStack gap="$x2" padding="$x3">
          <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
            <AppText tone="primary" variant="h4">
              {rent}
            </AppText>
            {room.isVerifiedHost ? (
              <StatusBadge icon="verified-user" label="Verified host" tone="success" />
            ) : null}
          </XStack>
          <AppText numberOfLines={2} variant="bodyStrong">
            {room.title}
          </AppText>
          {room.broadLocation ? (
            <XStack alignItems="center" gap="$x1">
              <AppIcon color={theme.colorMuted?.val} name="map-pin" size={14} />
              <AppText flex={1} numberOfLines={1} tone="muted" variant="caption">
                {room.broadLocation}
              </AppText>
            </XStack>
          ) : null}
          <XStack flexWrap="wrap" gap="$x1">
            {tags.slice(0, MAX_TAGS).map((tag) => (
              <Chip key={tag} label={tag} variant="tag" />
            ))}
          </XStack>
        </YStack>
      </Card>
      {onToggleSave ? (
        <YStack position="absolute" right={8} top={8}>
          <SaveHeart onPress={onToggleSave} saved={saved} title={room.title} />
        </YStack>
      ) : null}
    </YStack>
  );
}

/** 44pt save toggle on a solid surface so it stays visible over any photo; exposes its state as a switch. */
export function SaveHeart({
  saved,
  onPress,
  title,
}: {
  saved: boolean;
  onPress: () => void;
  title: string;
}) {
  const theme = useTheme();
  return (
    <YStack
      alignItems="center"
      aria-checked={saved}
      aria-label={`Save ${title}`}
      backgroundColor={saved ? '$primary' : '$surface'}
      borderColor={saved ? '$primary' : '$borderColor'}
      borderRadius="$pill"
      borderWidth={1}
      cursor="pointer"
      focusVisibleStyle={focusRing}
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

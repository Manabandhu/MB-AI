import { brand } from '@manabandhu/design-system';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { LocationSelectorModal } from '@/modules/foundation/location/LocationSelectorModal';
import { UnreadNotificationDot } from '@/modules/foundation/shell/UnreadNotificationDot';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { GradientSurface } from '@/modules/shared/ui/GradientSurface';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useFormFactor } from '@/platform/formFactor';
import { greetingName } from './greetingName';

/** How far the Ask card on Home slides up over the strip; the strip reserves that space below its content. */
export const ASK_CARD_OVERLAP = 28;
/** Space between the strip's content and the overlapping card. */
const STRIP_BOTTOM_GAP = 12;
/** Space below the status bar / notch. */
const STRIP_TOP_GAP = 8;
/** Horizontal padding on wide layouts ($x6); the strip is wider than the content column by twice this. */
const WIDE_GUTTER = 24;

function greetingKey(hour: number) {
  if (hour < 5) return 'greeting.evening' as const;
  if (hour < 12) return 'greeting.morning' as const;
  if (hour < 17) return 'greeting.afternoon' as const;
  return 'greeting.evening' as const;
}

/** Sun through the afternoon, moon in the evening and night (replaces the old waving-hand emoji). */
function greetingIcon(hour: number) {
  return hour >= 5 && hour < 17 ? ('sun' as const) : ('moon' as const);
}

const onBrand = brand.color.onPrimary;
const onBrandMuted = brand.color.onPrimaryMuted;
const glass = brand.color.onPrimaryGlass;

function HeaderIcon({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: 'bell';
  label: string;
  onPress: () => void;
  badge?: boolean;
}) {
  return (
    <YStack
      alignItems="center"
      aria-label={label}
      backgroundColor={glass}
      borderRadius="$pill"
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      height="$touch"
      justifyContent="center"
      onPress={onPress}
      {...keyboardPress(onPress)}
      position="relative"
      pressStyle={{ opacity: 0.7 }}
      role="button"
      width="$touch"
    >
      <AppIcon color={onBrand} name={icon} size={19} />
      {badge ? <UnreadNotificationDot /> : null}
    </YStack>
  );
}

/**
 * Thin brand strip that runs edge to edge under the status bar / notch: avatar, greeting with the member's name,
 * city, and notifications (search lives in the Ask card). Light status-bar icons while Home is focused.
 */
export function HomeHeader() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const location = useLocationStore((s) => s.currentLocation);
  const [locationOpen, setLocationOpen] = useState(false);
  const [focused, setFocused] = useState(true);
  const { navigationStyle, maxContentWidth } = useFormFactor();
  const name = greetingName(user?.user_metadata);
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Member';
  const phoneChrome = navigationStyle === 'bottom';

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const hour = new Date().getHours();
  const greeting = t(greetingKey(hour));
  const openProfile = () => router.push('/profile');
  const openCity = () => setLocationOpen(true);
  return (
    <GradientSurface corners="bottom" padding={0} radius={24}>
      {focused ? <StatusBar style="light" /> : null}
      <YStack
        alignSelf="center"
        gap="$x2"
        maxWidth={maxContentWidth + 2 * WIDE_GUTTER}
        paddingBottom={ASK_CARD_OVERLAP + STRIP_BOTTOM_GAP}
        paddingHorizontal={phoneChrome ? '$x4' : '$x6'}
        paddingTop={insets.top + STRIP_TOP_GAP}
        width="100%"
      >
        <XStack alignItems="center" gap="$x3">
          {phoneChrome ? (
            <YStack
              alignItems="center"
              aria-label={t('shell.openProfile')}
              borderRadius="$pill"
              cursor="pointer"
              focusVisibleStyle={{
                outlineWidth: 3,
                outlineStyle: 'solid',
                outlineColor: '$outlineColor',
              }}
              focusable
              justifyContent="center"
              minHeight="$touch"
              minWidth="$touch"
              onPress={openProfile}
              {...keyboardPress(openProfile)}
              role="button"
            >
              <Avatar
                imageUrl={user?.user_metadata?.avatar_url as string | undefined}
                name={fullName}
                size="md"
              />
            </YStack>
          ) : null}
          <YStack flex={1} gap={2}>
            <XStack alignItems="center" gap="$x2">
              <AppIcon color={onBrand} name={greetingIcon(hour)} size={18} />
              <AppText color={onBrand} flex={1} numberOfLines={1} role="heading" variant="h4">
                {name ? `${greeting}, ${name}` : greeting}
              </AppText>
            </XStack>
            <XStack
              alignItems="center"
              alignSelf="flex-start"
              aria-label={`${location.name}. ${t('home.changeCity')}`}
              borderRadius="$control"
              cursor="pointer"
              focusVisibleStyle={{
                outlineWidth: 3,
                outlineStyle: 'solid',
                outlineColor: '$outlineColor',
              }}
              focusable
              gap={4}
              marginVertical={-8}
              minHeight={44}
              onPress={openCity}
              {...keyboardPress(openCity)}
              pressStyle={{ opacity: 0.7 }}
              role="button"
            >
              <AppIcon color={onBrandMuted} name="map-pin" size={14} />
              <AppText color={onBrandMuted} maxWidth={220} numberOfLines={1} variant="label">
                {location.name}
              </AppText>
              <AppIcon color={onBrandMuted} name="chevron-down" size={14} />
            </XStack>
          </YStack>
          {phoneChrome ? (
            <HeaderIcon
              badge
              icon="bell"
              label={t('shell.notifications')}
              onPress={() => router.push('/notifications')}
            />
          ) : null}
        </XStack>
      </YStack>
      <LocationSelectorModal onClose={() => setLocationOpen(false)} visible={locationOpen} />
    </GradientSurface>
  );
}

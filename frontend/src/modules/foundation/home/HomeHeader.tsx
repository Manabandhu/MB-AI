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
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { AuroraBackground } from '@/modules/shared/ui/motion/AuroraBackground';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { useFormFactor } from '@/platform/formFactor';
import { greetingName } from './greetingName';

/** How far the Ask card on Home slides up over the strip; the strip reserves that space below its content. */
export const ASK_CARD_OVERLAP = 32;
/** Space between the strip's content and the overlapping card. */
const STRIP_BOTTOM_GAP = 20;
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
/** Hairline around glass controls on the aurora. */
const glassBorder = brand.color.onPrimaryHairline;

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
      borderColor={glassBorder}
      borderRadius="$pill"
      borderWidth={1}
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      height="$touch"
      justifyContent="center"
      onPress={onPress}
      {...keyboardPress(onPress)}
      position="relative"
      pressStyle={{ opacity: 0.7, scale: 0.92 }}
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
  const [size, setSize] = useState({ width: 0, height: 0 });
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
    <YStack
      borderBottomLeftRadius={32}
      borderBottomRightRadius={32}
      onLayout={(event) =>
        setSize({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }
      overflow="hidden"
      position="relative"
    >
      {focused ? <StatusBar style="light" /> : null}
      <AuroraBackground height={size.height} width={size.width} />
      <YStack
        alignSelf="center"
        gap="$x4"
        maxWidth={maxContentWidth + 2 * WIDE_GUTTER}
        paddingBottom={ASK_CARD_OVERLAP + STRIP_BOTTOM_GAP}
        paddingHorizontal={phoneChrome ? '$x4' : '$x6'}
        paddingTop={insets.top + STRIP_TOP_GAP}
        position="relative"
        width="100%"
        zIndex={1}
      >
        <XStack alignItems="center" gap="$x3">
          {phoneChrome ? (
            <YStack
              alignItems="center"
              aria-label={t('shell.openProfile')}
              borderColor={glassBorder}
              borderRadius="$pill"
              borderWidth={2}
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
              pressStyle={{ scale: 0.92 }}
              role="button"
            >
              <Avatar
                imageUrl={user?.user_metadata?.avatar_url as string | undefined}
                name={fullName}
                size="md"
              />
            </YStack>
          ) : null}
          <XStack
            alignItems="center"
            aria-label={`${location.name}. ${t('home.changeCity')}`}
            backgroundColor={glass}
            borderColor={glassBorder}
            borderRadius="$pill"
            borderWidth={1}
            cursor="pointer"
            flexShrink={1}
            focusVisibleStyle={{
              outlineWidth: 3,
              outlineStyle: 'solid',
              outlineColor: '$outlineColor',
            }}
            focusable
            gap={6}
            minHeight={36}
            onPress={openCity}
            {...keyboardPress(openCity)}
            paddingHorizontal="$x3"
            pressStyle={{ opacity: 0.7, scale: 0.96 }}
            role="button"
          >
            <AppIcon color={onBrand} name="map-pin" size={14} />
            <AppText color={onBrand} flexShrink={1} numberOfLines={1} variant="label">
              {location.name}
            </AppText>
            <AppIcon color={onBrandMuted} name="chevron-down" size={14} />
          </XStack>
          <YStack flex={1} />
          {phoneChrome ? (
            <HeaderIcon
              badge
              icon="bell"
              label={t('shell.notifications')}
              onPress={() => router.push('/notifications')}
            />
          ) : null}
        </XStack>
        <FadeIn>
          <YStack gap={2}>
            <XStack alignItems="center" gap="$x2">
              <AppIcon color={onBrandMuted} name={greetingIcon(hour)} size={16} />
              <AppText color={onBrandMuted} variant="label">
                {greeting}
              </AppText>
            </XStack>
            <AppText color={onBrand} numberOfLines={1} role="heading" variant="h1">
              {name ?? t('greeting.welcomeBack')}
            </AppText>
          </YStack>
        </FadeIn>
      </YStack>
      <LocationSelectorModal onClose={() => setLocationOpen(false)} visible={locationOpen} />
    </YStack>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { LocationSelectorModal } from '@/modules/foundation/components/LocationSelectorModal';
import { useQuickJump } from '@/modules/foundation/launcher/QuickJump';
import { UnreadNotificationDot } from '@/modules/foundation/shell/UnreadNotificationDot';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useFormFactor } from '@/platform/formFactor';
import { greetingName } from './greetingName';

function greetingKey(hour: number) {
  if (hour < 5) return 'greeting.evening' as const;
  if (hour < 12) return 'greeting.morning' as const;
  if (hour < 17) return 'greeting.afternoon' as const;
  return 'greeting.evening' as const;
}

/** A calm, personal starting point with visible search and location controls. */
export function HomeHeader() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const location = useLocationStore((state) => state.currentLocation);
  const [locationOpen, setLocationOpen] = useState(false);
  const { navigationStyle, maxContentWidth } = useFormFactor();
  const open = useQuickJump();
  const name = greetingName(user?.user_metadata);
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'Member';
  const greeting = t(greetingKey(new Date().getHours()));
  const phone = navigationStyle === 'bottom';
  return (
    <YStack backgroundColor="$background" paddingTop={insets.top + 16} paddingBottom="$x5">
      <YStack
        alignSelf="center"
        maxWidth={maxContentWidth + 48}
        paddingHorizontal={phone ? '$x4' : '$x6'}
        width="100%"
        gap="$x4"
      >
        <XStack alignItems="center" gap="$x3">
          <YStack flex={1} minWidth={0} gap="$x1">
            <AppText variant="overline" tone="primary">
              ManaBandhu
            </AppText>
            <Heading variant="h2">{name ? `${greeting}, ${name}` : greeting}</Heading>
          </YStack>
          {phone ? (
            <>
              <IconButton
                badge={<UnreadNotificationDot />}
                icon="bell"
                label={t('shell.notifications')}
                onPress={() => router.push('/notifications')}
              />
              <YStack
                role="button"
                aria-label={t('shell.openProfile')}
                alignItems="center"
                justifyContent="center"
                minHeight="$touch"
                minWidth="$touch"
                borderRadius="$pill"
                onPress={() => router.push('/profile')}
                {...keyboardPress(() => router.push('/profile'))}
                focusVisibleStyle={{
                  outlineColor: '$outlineColor',
                  outlineWidth: 3,
                  outlineStyle: 'solid',
                }}
              >
                <Avatar
                  name={fullName}
                  imageUrl={user?.user_metadata?.avatar_url as string | undefined}
                  size="md"
                />
              </YStack>
            </>
          ) : null}
        </XStack>
        <XStack alignItems="center" flexWrap="wrap" gap="$x2">
          <AppButton
            label={location.name}
            icon="map-pin"
            iconAfter="chevron-down"
            variant="ghost"
            size="sm"
            onPress={() => setLocationOpen(true)}
          />
          <YStack flex={1} />
          <IconButton
            icon="compass"
            label={t('navigation.openJump')}
            onPress={open}
            variant="plain"
          />
          <AppButton
            label={t('navigation.search')}
            icon="search"
            variant="secondary"
            size="sm"
            route="/search"
          />
        </XStack>
      </YStack>
      <LocationSelectorModal onClose={() => setLocationOpen(false)} visible={locationOpen} />
    </YStack>
  );
}

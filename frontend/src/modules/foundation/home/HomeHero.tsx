import { router } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { LocationSelectorModal } from '@/modules/foundation/components/LocationSelectorModal';
import { UnreadNotificationDot } from '@/modules/foundation/shell/UnreadNotificationDot';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Avatar } from '@/modules/shared/ui/Avatar';
import { GradientSurface } from '@/modules/shared/ui/GradientSurface';
import { BrandHero3D } from '@/modules/shared/ui/hero/BrandHero3D';
import { useFormFactor } from '@/platform/formFactor';

function greetingFor(hour: number) {
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Greeting, location, and search entry at the top of Home, on the brand gradient. */
export function HomeHero() {
  const user = useAuthStore((s) => s.user);
  const location = useLocationStore((s) => s.currentLocation);
  const [locationOpen, setLocationOpen] = useState(false);
  const { navigationStyle, windowClass } = useFormFactor();
  const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const firstName = fullName?.split(/\s+/)[0];
  const showAccountButtons = navigationStyle === 'bottom';
  const wide = windowClass === 'expanded' || windowClass === 'wide';

  return (
    <GradientSurface padding={windowClass === 'compact' ? 20 : 32} radius={28}>
      <XStack alignItems="center" gap="$x6">
        <YStack flex={1} gap="$x4">
          <XStack alignItems="flex-start" gap="$x3">
            <YStack flex={1} gap="$x2">
              <AppText color="rgba(255,255,255,0.8)" variant="label">
                {greetingFor(new Date().getHours())}
                {firstName ? ',' : ''}
              </AppText>
              <AppText
                role="heading"
                color="#ffffff"
                variant={windowClass === 'compact' ? 'h2' : 'h1'}
              >
                {firstName ? `${firstName} 👋` : 'Welcome back 👋'}
              </AppText>
            </YStack>
            {showAccountButtons ? (
              <XStack gap="$x2">
                <YStack
                  aria-label="Open notifications"
                  role="button"
                  alignItems="center"
                  backgroundColor="rgba(255,255,255,0.16)"
                  borderRadius="$pill"
                  height={44}
                  justifyContent="center"
                  onPress={() => router.push('/notifications')}
                  pressStyle={{ opacity: 0.7 }}
                  width={44}
                >
                  <AppIcon color="#ffffff" name="bell" size={20} />
                  <UnreadNotificationDot />
                </YStack>
                <YStack
                  aria-label="Open profile"
                  role="button"
                  onPress={() => router.push('/profile')}
                >
                  <Avatar
                    imageUrl={user?.user_metadata?.avatar_url as string | undefined}
                    name={fullName ?? user?.email ?? 'Member'}
                    size="md"
                  />
                </YStack>
              </XStack>
            ) : null}
          </XStack>

          <XStack
            aria-label={`Location: ${location.name}. Change city`}
            role="button"
            alignItems="center"
            alignSelf="flex-start"
            backgroundColor="rgba(255,255,255,0.16)"
            borderRadius="$pill"
            cursor="pointer"
            gap="$x1"
            minHeight={36}
            onPress={() => setLocationOpen(true)}
            paddingHorizontal="$x3"
            pressStyle={{ opacity: 0.8 }}
          >
            <AppIcon color="#ffffff" name="map-pin" size={14} />
            <AppText color="#ffffff" maxWidth={220} numberOfLines={1} variant="label">
              {location.name}
            </AppText>
            <AppIcon color="#ffffff" name="chevron-down" size={14} />
          </XStack>

          <XStack
            aria-label="Search rooms, rides, jobs, and people"
            role="button"
            alignItems="center"
            backgroundColor="$surface"
            borderRadius="$control"
            cursor="pointer"
            gap="$x3"
            height={52}
            maxWidth={640}
            onPress={() => router.push('/search')}
            paddingHorizontal="$x4"
            pressStyle={{ opacity: 0.9 }}
          >
            <AppIcon name="search" size={20} />
            <AppText flex={1} numberOfLines={1} tone="muted">
              Search rooms, rides, jobs, people…
            </AppText>
          </XStack>
        </YStack>
        {wide ? <BrandHero3D size={240} /> : null}
      </XStack>
      <LocationSelectorModal onClose={() => setLocationOpen(false)} visible={locationOpen} />
    </GradientSurface>
  );
}

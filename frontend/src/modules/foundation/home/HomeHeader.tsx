import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { LocationSelectorModal } from '@/modules/foundation/components/LocationSelectorModal';
import { UnreadNotificationDot } from '@/modules/foundation/shell/UnreadNotificationDot';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { EditorialHeading } from '@/modules/shared/ui/EditorialHeading';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';
import { greetingName } from './greetingName';

/** A single search entry under an editorial headline; location is a separate explicit scope. */
export function HomeHeader() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { windowClass, maxContentWidth } = useAdaptiveLayout();
  const phone = windowClass === 'compact';
  const name = greetingName(useAuthStore((s) => s.user)?.user_metadata);
  const location = useLocationStore((s) => s.currentLocation);
  const [locationOpen, setLocationOpen] = useState(false);
  const { palette } = useAppearance();
  const search = () => router.push('/search');
  return (
    <YStack paddingTop={insets.top + (phone ? 20 : 36)} paddingBottom="$x6">
      <YStack
        width="100%"
        maxWidth={maxContentWidth + 48}
        alignSelf="center"
        paddingHorizontal={phone ? '$x5' : '$x8'}
        gap="$x6"
      >
        <XStack alignItems="center" gap="$x2">
          <AppText flex={1} variant="caption" tone="muted">
            {name ? t('home.helloName', { name }) : t('greeting.welcomeBack')}
          </AppText>
          {phone ? (
            <IconButton
              icon="bell"
              label={t('shell.notifications')}
              badge={<UnreadNotificationDot />}
              onPress={() => router.push('/notifications')}
              variant="plain"
            />
          ) : null}
        </XStack>
        <YStack gap="$x3">
          <EditorialHeading
            variant="display"
            fontSize={phone ? 44 : 64}
            lineHeight={phone ? 48 : 68}
            letterSpacing={-2}
          >
            {t('home.cityHeadline')}
          </EditorialHeading>
          <AppText tone="muted" variant="body" maxWidth={440}>
            {t('home.citySubtitle')}
          </AppText>
        </YStack>
        <XStack
          alignItems="center"
          minHeight={64}
          gap="$x3"
          paddingHorizontal="$x5"
          backgroundColor="$surface"
          borderRadius="$pill"
          borderWidth={1}
          borderColor="$borderColor"
          role="button"
          aria-label={t('navigation.search')}
          cursor="pointer"
          onPress={search}
          {...keyboardPress(search)}
          focusVisibleStyle={{
            outlineWidth: 3,
            outlineStyle: 'solid',
            outlineColor: '$outlineColor',
          }}
        >
          <AppIcon name="search" color={palette.ink} size={22} />
          <AppText flex={1} variant="body" tone="muted">
            {t('home.searchPlaceholder')}
          </AppText>
          <AppIcon name="arrow-right" color={palette.ink} size={20} />
        </XStack>
        <XStack>
          <AppButton
            label={location.name}
            icon="map-pin"
            iconAfter="chevron-down"
            variant="ghost"
            size="sm"
            onPress={() => setLocationOpen(true)}
          />
        </XStack>
        <LocationSelectorModal visible={locationOpen} onClose={() => setLocationOpen(false)} />
      </YStack>
    </YStack>
  );
}

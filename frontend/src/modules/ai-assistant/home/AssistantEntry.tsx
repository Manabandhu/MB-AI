import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { useAppearance } from '@/theme/ThemeProvider';

/**
 * Home's primary entry point: looks like an input and opens the assistant. Quick prompts open it pre-filled;
 * nothing is sent until the member taps send.
 */
export function AssistantEntry() {
  const t = useT();
  const { palette } = useAppearance();
  const theme = useTheme();
  const open = (prompt?: string) =>
    router.push(
      (prompt ? `/assistant?prompt=${encodeURIComponent(prompt)}` : '/assistant') as Href,
    );
  const prompts = [
    { label: t('home.promptRoom'), text: t('home.promptRoomText'), icon: 'bed' as const },
    { label: t('home.promptVisa'), text: t('home.promptVisaText'), icon: 'plane' as const },
    { label: t('home.promptRide'), text: t('home.promptRideText'), icon: 'car' as const },
  ];
  return (
    <Card gap="$x3" padding="$x3" variant="elevated">
      <XStack alignItems="center" gap="$x2">
        <XStack
          flex={1}
          alignItems="center"
          aria-label={t('home.askTitle')}
          backgroundColor="$surfaceContainerLow"
          borderRadius="$control"
          cursor="pointer"
          gap="$x3"
          minHeight={48}
          onPress={() => open()}
          paddingHorizontal="$x3"
          pressStyle={{ opacity: 0.85 }}
          role="button"
        >
          <YStack
            alignItems="center"
            backgroundColor="$primary"
            borderRadius="$pill"
            height={30}
            justifyContent="center"
            width={30}
          >
            <AppIcon color={theme.onPrimary?.val} name="sparks" size={16} />
          </YStack>
          <AppText flex={1} numberOfLines={1} tone="muted">
            {t('home.ask')}
          </AppText>
          <AppIcon color={palette.primary} name="arrow-right" size={18} />
        </XStack>
        <YStack
          alignItems="center"
          aria-label={t('home.searchPlaceholder')}
          backgroundColor="$surfaceContainerLow"
          borderRadius="$control"
          cursor="pointer"
          height={48}
          justifyContent="center"
          onPress={() => router.push('/search')}
          pressStyle={{ opacity: 0.8 }}
          role="button"
          width={48}
        >
          <AppIcon color={palette.primary} name="search" size={20} />
        </YStack>
      </XStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$x2">
          {prompts.map((prompt) => (
            <Chip
              icon={prompt.icon}
              key={prompt.label}
              label={prompt.label}
              onPress={() => open(prompt.text)}
            />
          ))}
        </XStack>
      </ScrollView>
    </Card>
  );
}

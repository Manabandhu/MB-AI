import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { useAppearance } from '@/theme/ThemeProvider';

/** Clear assistant entry and optional prompts. A prompt pre-fills a draft; it never sends a message. */
export function AssistantEntry() {
  const t = useT();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const { palette } = useAppearance();
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
    <Card gap="$x3" padding="$x4">
      <XStack alignItems="center" gap="$x2">
        <XStack
          flex={1}
          alignItems="center"
          aria-label={t('home.askTitle')}
          cursor="pointer"
          gap="$x3"
          minHeight="$touch"
          onPress={() => open()}
          {...keyboardPress(() => open())}
          focusVisibleStyle={{
            outlineWidth: 3,
            outlineStyle: 'solid',
            outlineColor: '$outlineColor',
          }}
          borderRadius="$control"
          role="button"
        >
          <YStack
            alignItems="center"
            backgroundColor="$primaryTint"
            borderRadius="$control"
            height={44}
            justifyContent="center"
            width={44}
          >
            <AppIcon color={palette.primary} name="sparks" size={20} />
          </YStack>
          <AppText flex={1} variant="bodyStrong">
            {t('home.askTitle')}
          </AppText>
          <AppIcon color={palette.muted} name="arrow-right" size={18} />
        </XStack>
        <IconButton
          icon={suggestionsOpen ? 'close' : 'chevron-down'}
          label={t(suggestionsOpen ? 'home.hideSuggestions' : 'home.showSuggestions')}
          variant="plain"
          onPress={() => setSuggestionsOpen((open) => !open)}
        />
      </XStack>
      {suggestionsOpen ? (
        <XStack flexWrap="wrap" gap="$x2">
          {prompts.map((prompt) => (
            <Chip
              icon={prompt.icon}
              key={prompt.label}
              label={prompt.label}
              onPress={() => open(prompt.text)}
            />
          ))}
        </XStack>
      ) : null}
    </Card>
  );
}

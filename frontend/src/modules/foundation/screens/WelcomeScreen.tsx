import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useRedirectIfAuthenticated } from '@/lib/authStore';
import { LanguagePicker } from '@/modules/foundation/settings/LanguagePicker';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BrandLogo } from '@/modules/shared/ui/BrandLogo';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';
import { useAdaptiveLayout } from '@/platform/adaptive';

/** One honest introduction with clear account entry; no pager is required to discover the purpose. */
export function WelcomeScreen() {
  useRedirectIfAuthenticated();
  const t = useT();
  const { windowClass } = useAdaptiveLayout();
  const phone = windowClass === 'compact';
  return (
    <Screen>
      <XStack
        paddingTop="$x4"
        paddingBottom="$x6"
        alignItems="center"
        justifyContent="space-between"
        gap="$x3"
        flexWrap="wrap"
      >
        <BrandLogo variant="wordmark" size={32} />
        <LanguagePicker />
      </XStack>
      <XStack flexDirection={phone ? 'column' : 'row'} gap="$x8" paddingVertical="$x8">
        <YStack flex={phone ? undefined : 1} minWidth={0} gap="$x6">
          <AppText variant="overline" tone="muted">
            MANABANDHU
          </AppText>
          <Heading
            variant="display"
            fontSize={phone ? 38 : 56}
            lineHeight={phone ? 46 : 64}
            letterSpacing={0}
          >
            {t('home.cityHeadline')}
          </Heading>
          <AppText variant="lead" tone="muted" maxWidth={420}>
            {t('home.citySubtitle')}
          </AppText>
          <YStack maxWidth={360} gap="$x3">
            <AppButton
              label={t('settle.signup')}
              route="/sign-up"
              iconAfter="arrow-right"
              fullWidth
              size="lg"
            />
            <AppButton label={t('settle.signin')} route="/sign-in" variant="ghost" fullWidth />
          </YStack>
        </YStack>
        <YStack flex={phone ? undefined : 1} minWidth={0} gap="$x3">
          {(
            [
              { label: 'live', body: 'liveSection', icon: 'home' },
              { label: 'work', body: 'workSection', icon: 'briefcase' },
              { label: 'connect', body: 'connectSection', icon: 'community' },
            ] as const
          ).map((item, index) => (
            <Card key={item.label} padding="$x6" gap="$x5">
              <XStack alignItems="center" justifyContent="space-between">
                <AppIcon name={item.icon} size={26} />
                <AppText variant="caption" tone="muted">
                  0{index + 1}
                </AppText>
              </XStack>
              <YStack gap="$x1">
                <AppText variant="h3">{t(`home.${item.label}`)}</AppText>
                <AppText tone="muted">{t(`home.${item.body}`)}</AppText>
              </YStack>
            </Card>
          ))}
        </YStack>
      </XStack>
    </Screen>
  );
}

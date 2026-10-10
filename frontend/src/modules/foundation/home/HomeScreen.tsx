import { useQueryClient } from '@tanstack/react-query';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useShellContent } from '@/modules/foundation/shell/shellApi';
import { AppText } from '@/modules/shared/ui/AppText';
import { CountUp } from '@/modules/shared/ui/motion/CountUp';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { HomeHero } from './HomeHero';
import { InviteCard } from './InviteCard';
import { QuickAccess } from './QuickAccess';
import { homeWidgets } from './registry';
import { WidgetBoundary } from './WidgetBoundary';

/** Live counts from the backend. A failed or empty response simply hides the row; numbers are never invented. */
function CommunityPulse() {
  const { data } = useShellContent('home');
  const metrics = data?.metrics ?? [];
  const t = useT();
  if (metrics.length === 0) return null;
  return (
    <YStack gap="$x2">
      <AppText tone="muted" variant="overline">
        {t('home.communityPulse')}
      </AppText>
      <XStack flexWrap="wrap" gap="$x2">
        {metrics.map((metric) => (
          <XStack
            alignItems="baseline"
            backgroundColor="$surface"
            borderColor="$borderColor"
            borderRadius="$pill"
            borderWidth={1}
            gap="$x1"
            key={metric.label}
            paddingHorizontal="$x3"
            paddingVertical="$x1"
          >
            <CountUp tone="primary" value={metric.value} variant="bodyStrong" />
            <AppText tone="muted" variant="caption">
              {metric.label}
            </AppText>
          </XStack>
        ))}
      </XStack>
    </YStack>
  );
}

/**
 * Home: greeting, quick access, live counts, and one widget per module. Widgets fetch in parallel and fail
 * independently; pull-to-refresh reloads all of them.
 */
export function HomeScreen() {
  const queryClient = useQueryClient();
  const t = useT();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[1] === 'home-widget' || query.queryKey[2] === 'home',
      });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <Screen bottomInset={0} onRefresh={onRefresh} refreshing={refreshing}>
      <Head>
        <title>Home · ManaBandhu</title>
      </Head>
      <FadeIn>
        <HomeHero />
      </FadeIn>
      <FadeIn index={1}>
        <Section title={t('home.quickAccess')}>
          <QuickAccess />
        </Section>
      </FadeIn>
      <FadeIn index={2}>
        <CommunityPulse />
      </FadeIn>
      <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }}>
        {homeWidgets.map(({ id, Component }, index) => (
          <FadeIn index={index + 3} key={id}>
            <WidgetBoundary name={id}>
              <Component />
            </WidgetBoundary>
          </FadeIn>
        ))}
      </ResponsiveGrid>
      <InviteCard />
    </Screen>
  );
}

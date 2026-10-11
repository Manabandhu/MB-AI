import { useQueryClient } from '@tanstack/react-query';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { AssistantEntry } from '@/modules/ai-assistant';
import { useShellContent } from '@/modules/foundation/shell/shellApi';
import { AppText } from '@/modules/shared/ui/AppText';
import { CountUp } from '@/modules/shared/ui/motion/CountUp';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { useAppearanceStore } from '@/theme/themePreferenceStore';
import { greetingName } from './greetingName';
import { ASK_CARD_OVERLAP, HomeHeader } from './HomeHeader';
import { InviteCard } from './InviteCard';
import { NicknameNudge } from './NicknameNudge';
import { NicknameSheet } from './NicknameSheet';
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

  const user = useAuthStore((s) => s.user);
  const nudgeDismissed = useAppearanceStore((s) => s.nicknamePromptDismissed);
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const showNudge = !nudgeDismissed && greetingName(user?.user_metadata) === null;

  return (
    <Screen hero={<HomeHeader />} onRefresh={onRefresh} refreshing={refreshing}>
      <Head>
        <title>Home · ManaBandhu</title>
      </Head>
      {/* The Ask card overlaps the bottom of the brand strip. */}
      <YStack marginTop={-ASK_CARD_OVERLAP} position="relative" zIndex={2}>
        <AssistantEntry />
      </YStack>
      {showNudge ? <NicknameNudge onSet={() => setNicknameOpen(true)} /> : null}
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
      <NicknameSheet onClose={() => setNicknameOpen(false)} visible={nicknameOpen} />
    </Screen>
  );
}

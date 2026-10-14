import { useQueryClient } from '@tanstack/react-query';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { useAppearanceStore } from '@/theme/themePreferenceStore';
import { greetingName } from './greetingName';
import { HomeHeader } from './HomeHeader';
import { NicknameNudge } from './NicknameNudge';
import { NicknameSheet } from './NicknameSheet';
import { QuickAccess } from './QuickAccess';
import { homeWidgets } from './registry';
import { WidgetBoundary } from './WidgetBoundary';

/** Search-first Home with an optional local discovery feed. */
export function HomeScreen() {
  const queryClient = useQueryClient();
  const t = useT();
  const [refreshing, setRefreshing] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
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
      {showNudge ? <NicknameNudge onSet={() => setNicknameOpen(true)} /> : null}
      <FadeIn index={1}>
        <Section
          title={t('home.quickAccess')}
          action={{ label: t('navigation.allFeatures'), href: '/explore' }}
        >
          <QuickAccess />
        </Section>
      </FadeIn>
      <AppButton
        label={showFeed ? t('home.hideFeed') : t('home.showFeed')}
        icon={showFeed ? 'minus' : 'plus'}
        variant="secondary"
        expanded={showFeed}
        onPress={() => setShowFeed((value) => !value)}
      />
      {showFeed ? (
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 3 }}>
          {homeWidgets.map(({ id, Component }, index) => (
            <FadeIn index={index + 3} key={id}>
              <WidgetBoundary name={id}>
                <Component />
              </WidgetBoundary>
            </FadeIn>
          ))}
        </ResponsiveGrid>
      ) : null}
      <NicknameSheet onClose={() => setNicknameOpen(false)} visible={nicknameOpen} />
    </Screen>
  );
}

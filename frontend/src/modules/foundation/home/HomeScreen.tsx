import { useQueryClient } from '@tanstack/react-query';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import { useAuthStore } from '@/lib/authStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { useAppearanceStore } from '@/theme/themePreferenceStore';
import { greetingName } from './greetingName';
import { HomeHeader } from './HomeHeader';
import { NicknameNudge } from './NicknameNudge';
import { NicknameSheet } from './NicknameSheet';
import { homeWidgets } from './registry';
import { WidgetBoundary } from './WidgetBoundary';

type Intent = 'live' | 'work' | 'connect';
const groups = {
  live: {
    widgets: ['rooms', 'rides'],
    routes: ['/rooms', '/rides', '/marketplace'],
    labels: ['home.rooms', 'home.rides', 'home.marketplace'],
    icons: ['bed', 'car', 'marketplace'],
  },
  work: {
    widgets: ['jobs', 'referrals'],
    routes: ['/jobs', '/referrals', '/immigration'],
    labels: ['home.jobs', 'home.referrals', 'home.immigration'],
    icons: ['briefcase', 'handshake', 'globe'],
  },
  connect: {
    widgets: ['community', 'events'],
    routes: ['/community', '/events', '/chat'],
    labels: ['home.community', 'home.events', 'home.chat'],
    icons: ['community', 'calendar', 'message'],
  },
} as const;

/** Task-led discovery: only the selected pair of independent module widgets mounts. */
export function HomeScreen() {
  const t = useT();
  const client = useQueryClient();
  const [intent, setIntent] = useState<Intent>('live');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await client.invalidateQueries({ predicate: (q) => q.queryKey[1] === 'home-widget' });
    } finally {
      setRefreshing(false);
    }
  }, [client]);
  const user = useAuthStore((s) => s.user);
  const dismissed = useAppearanceStore((s) => s.nicknamePromptDismissed);
  const [nicknameOpen, setNicknameOpen] = useState(false);
  const group = groups[intent];
  return (
    <Screen hero={<HomeHeader />} refreshing={refreshing} onRefresh={onRefresh}>
      <Head>
        <title>Home · ManaBandhu</title>
      </Head>
      <SegmentedControl
        label={t('home.intentLabel')}
        options={[
          { value: 'live', label: t('home.live') },
          { value: 'work', label: t('home.work') },
          { value: 'connect', label: t('home.connect') },
        ]}
        value={intent}
        onChange={setIntent}
      />
      <XStack gap="$x2" flexWrap="wrap">
        {group.routes.map((route, index) => (
          <AppButton
            key={route}
            route={route}
            label={t(group.labels[index])}
            icon={group.icons[index]}
            variant="ghost"
            size="sm"
          />
        ))}
      </XStack>
      <YStack gap="$x4">
        <XStack alignItems="center" flexWrap="wrap" gap="$x2">
          <AppText variant="h3" flex={1}>
            {t(`home.${intent}Section`)}
          </AppText>
          <AppButton
            label={t('navigation.allFeatures')}
            route="/explore"
            variant="ghost"
            iconAfter="arrow-right"
            size="sm"
          />
        </XStack>
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 2, wide: 2 }} gap={20}>
          {homeWidgets
            .filter((w) => group.widgets.some((id) => id === w.id))
            .map(({ id, Component }) => (
              <WidgetBoundary key={id} name={id}>
                <Component />
              </WidgetBoundary>
            ))}
        </ResponsiveGrid>
      </YStack>
      <Card gap="$x3" padding="$x5" backgroundColor="$primaryTint">
        <AppText variant="h3">{t('settle.title')}</AppText>
        <AppText tone="muted">{t('settle.body')}</AppText>
        <XStack gap="$x2" flexWrap="wrap">
          <AppButton
            label={t('settle.visa')}
            route="/immigration"
            icon="globe"
            variant="secondary"
            size="sm"
          />
          <AppButton
            label={t('settle.expenses')}
            route="/expenses"
            icon="receipt"
            variant="secondary"
            size="sm"
          />
          <AppButton
            label={t('settle.safety')}
            route="/safety"
            icon="shield"
            variant="secondary"
            size="sm"
          />
        </XStack>
      </Card>
      {!dismissed && greetingName(user?.user_metadata) === null ? (
        <NicknameNudge onSet={() => setNicknameOpen(true)} />
      ) : null}
      <NicknameSheet visible={nicknameOpen} onClose={() => setNicknameOpen(false)} />
    </Screen>
  );
}

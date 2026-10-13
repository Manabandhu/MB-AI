import type { ModuleTone } from '@manabandhu/core';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@/i18n';
import {
  countByCategory,
  type ExploreCategory,
  exploreCategories,
  filterModules,
  groupByCategory,
  recentModules,
  resultSummary,
} from '@/modules/foundation/launcher/exploreFilters';
import { type LauncherModule, launcherModules } from '@/modules/foundation/launcher/moduleRegistry';
import { useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { discoveryKind } from '@/modules/shared/ui/DiscoveryArtwork';
import { DiscoveryCard } from '@/modules/shared/ui/DiscoveryCard';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAppearance } from '@/theme/ThemeProvider';
import { TabHeader } from '../TabHeader';

/** Icon well fill and icon colour per module tone (`danger` uses the error pastel, not the warm one). */
const toneStyle = {
  primary: { background: '$primaryTint', icon: 'primary' },
  teal: { background: '$tealTint', icon: 'teal' },
  warm: { background: '$warmTint', icon: 'warm' },
  danger: { background: '$errorBg', icon: 'error' },
} as const satisfies Record<ModuleTone, { background: string; icon: string }>;

const MODULE_COLUMNS = { compact: 2, medium: 2, expanded: 3, wide: 3 } as const;
const RECENT_COLUMNS = { compact: 2, medium: 2, expanded: 4, wide: 4 } as const;
const RECENT_LIMIT = 4;

function ToneIcon({ module, size }: { module: LauncherModule; size: number }) {
  const { palette } = useAppearance();
  const tone = toneStyle[module.tone];
  return (
    <YStack
      alignItems="center"
      backgroundColor={tone.background}
      borderRadius="$control"
      height={size}
      justifyContent="center"
      width={size}
    >
      <AppIcon color={palette[tone.icon]} name={module.icon} size={Math.round(size * 0.46)} />
    </YStack>
  );
}

function ModuleCard({ module, onOpen }: { module: LauncherModule; onOpen: () => void }) {
  return (
    <DiscoveryCard
      title={module.label}
      description={module.summary}
      href={module.route}
      kind={discoveryKind(module.key)}
      onPress={onOpen}
    />
  );
}

function RecentTile({ module, onOpen }: { module: LauncherModule; onOpen: () => void }) {
  return (
    <Card
      aria-label={`${module.label}, recently used`}
      href={module.route}
      onPress={onOpen}
      padding="$x3"
    >
      <XStack alignItems="center" gap="$x2" minHeight="$touch">
        <ToneIcon module={module} size={40} />
        <AppText flex={1} numberOfLines={1} variant="bodyStrong">
          {module.label}
        </AppText>
      </XStack>
    </Card>
  );
}

/**
 * Directory of every module, built from each module's own `moduleMeta`. With no search or category it shows the
 * member's recently used modules and then one section per category; searching or picking a category shows a flat,
 * counted list of matches.
 */
export function ExploreTab() {
  const t = useT();
  const [category, setCategory] = useState<ExploreCategory>('all');
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const recordVisit = useUserActivityStore((s) => s.recordModuleVisit);
  const recentVisits = useUserActivityStore((s) => s.recentVisits);

  // Only the first paint animates; later renders (typing, filtering) mount cards in place.
  const firstPaint = useRef(true);
  useEffect(() => {
    firstPaint.current = false;
  }, []);
  const animate = firstPaint.current;

  const trimmed = query.trim();
  const browsing = category === 'all' && !trimmed;
  const counts = useMemo(() => countByCategory(launcherModules, query), [query]);
  const results = useMemo(() => filterModules(launcherModules, query, category), [query, category]);
  const sections = useMemo(() => groupByCategory(launcherModules), []);
  const recent = useMemo(
    () => recentModules(launcherModules, recentVisits, RECENT_LIMIT),
    [recentVisits],
  );

  const open = (module: LauncherModule) => {
    recordVisit(module.key);
    router.push(module.route as Href);
  };
  const reset = () => {
    setQuery('');
    setCategory('all');
  };

  let index = 0;
  const card = (module: LauncherModule) => (
    <FadeIn animate={animate} index={index++} key={module.key}>
      <ModuleCard module={module} onOpen={() => open(module)} />
    </FadeIn>
  );

  return (
    <Screen>
      <Head>
        <title>Explore · ManaBandhu</title>
      </Head>
      <TabHeader subtitle={t('tabSubtitles.explore')} title={t('tabs.explore')} />
      <YStack gap="$x3">
        <TextField
          aria-label="Search features"
          autoCapitalize="none"
          autoCorrect={false}
          leadingIcon="search"
          onChangeText={setQuery}
          placeholder="Search features…"
          ref={inputRef}
          returnKeyType="search"
          trailing={
            query ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                size={18}
                variant="plain"
              />
            ) : null
          }
          value={query}
        />
        <FilterChipRow label="Categories" role="radiogroup">
          <Chip
            accessibilityLabel={`All, ${counts.all} ${counts.all === 1 ? 'feature' : 'features'}`}
            count={counts.all}
            label="All"
            onPress={() => setCategory('all')}
            radio
            selected={category === 'all'}
          />
          {exploreCategories.map((c) => {
            const count = counts[c.key];
            return (
              <Chip
                accessibilityLabel={`${c.label}, ${count} ${count === 1 ? 'feature' : 'features'}`}
                count={count}
                disabled={count === 0 && category !== c.key}
                key={c.key}
                label={c.label}
                onPress={() => setCategory(c.key)}
                radio
                selected={category === c.key}
              />
            );
          })}
        </FilterChipRow>
      </YStack>

      {browsing ? (
        <>
          {recent.length > 0 ? (
            <Section title="Recently used">
              <ResponsiveGrid columns={RECENT_COLUMNS} gap={12}>
                {recent.map((module) => (
                  <FadeIn animate={animate} index={index++} key={module.key}>
                    <RecentTile module={module} onOpen={() => open(module)} />
                  </FadeIn>
                ))}
              </ResponsiveGrid>
            </Section>
          ) : null}
          {sections.map((section) => (
            <Section key={section.category} title={section.label}>
              <ResponsiveGrid columns={MODULE_COLUMNS} gap={12}>
                {section.modules.map(card)}
              </ResponsiveGrid>
            </Section>
          ))}
        </>
      ) : results.length === 0 ? (
        <EmptyState
          actionLabel={trimmed ? 'Search rooms, rides, jobs and events' : undefined}
          body={
            trimmed
              ? `No ManaBandhu feature matches “${trimmed}”. Try another word, or search listings instead.`
              : 'Nothing in this category yet.'
          }
          iconName="search"
          onAction={
            trimmed
              ? () => router.push(`/search?q=${encodeURIComponent(trimmed)}` as Href)
              : undefined
          }
          onSecondaryAction={reset}
          secondaryActionLabel="Clear search"
          title="No matching features"
        />
      ) : (
        <YStack gap="$x3">
          <AppText aria-live="polite" tone="muted" variant="caption">
            {resultSummary(results.length, query, category)}
          </AppText>
          <ResponsiveGrid columns={MODULE_COLUMNS} gap={12}>
            {results.map(card)}
          </ResponsiveGrid>
        </YStack>
      )}
    </Screen>
  );
}

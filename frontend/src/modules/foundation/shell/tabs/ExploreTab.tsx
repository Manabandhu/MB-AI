import type { ModuleCategory } from '@manabandhu/core';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { launcherModules } from '@/modules/foundation/launcher/moduleRegistry';
import { useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAppearance } from '@/theme/ThemeProvider';
import { TabHeader } from '../TabHeader';

const categories: { key: ModuleCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'living', label: 'Living & getting around' },
  { key: 'career', label: 'Career' },
  { key: 'community', label: 'Community' },
  { key: 'essentials', label: 'Essentials' },
  { key: 'safety', label: 'Safety' },
];

const toneColor = { primary: 'primary', teal: 'teal', warm: 'warm', danger: 'error' } as const;
const toneBg = {
  primary: '$primaryTint',
  teal: '$tealTint',
  warm: '$warmTint',
  danger: '$warmTint',
} as const;

/** Directory of every module, searchable and filterable. Built from each module's own `moduleMeta`. */
export function ExploreTab() {
  const [category, setCategory] = useState<ModuleCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const recordVisit = useUserActivityStore((s) => s.recordModuleVisit);
  const { palette } = useAppearance();

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return launcherModules.filter(
      (m) =>
        (category === 'all' || m.category === category) &&
        (!q || m.label.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q)),
    );
  }, [category, query]);

  return (
    <Screen>
      <Head>
        <title>Explore · ManaBandhu</title>
      </Head>
      <TabHeader subtitle="Everything ManaBandhu can help with, in one place." title="Explore" />
      <YStack gap="$x3">
        <TextField
          aria-label="Filter modules"
          onChangeText={setQuery}
          placeholder="Search features…"
          returnKeyType="search"
          value={query}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$x2" paddingVertical="$x1">
            {categories.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                onPress={() => setCategory(c.key)}
                selected={category === c.key}
              />
            ))}
          </XStack>
        </ScrollView>
      </YStack>
      {modules.length === 0 ? (
        <EmptyState
          body="Try another word or clear the filter."
          iconName="search"
          title="No matching features"
        />
      ) : (
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 3, wide: 4 }} gap={12}>
          {modules.map((module, index) => (
            <FadeIn index={index} key={module.key}>
              <Card
                aria-label={`${module.label}. ${module.summary}`}
                onPress={() => {
                  recordVisit(module.key);
                  router.push(module.route as Href);
                }}
              >
                <XStack alignItems="center" gap="$x3">
                  <YStack
                    alignItems="center"
                    backgroundColor={toneBg[module.tone]}
                    borderRadius="$control"
                    height={48}
                    justifyContent="center"
                    width={48}
                  >
                    <AppIcon color={palette[toneColor[module.tone]]} name={module.icon} size={22} />
                  </YStack>
                  <YStack flex={1} gap={2}>
                    <AppText variant="bodyStrong">{module.label}</AppText>
                    <AppText numberOfLines={2} tone="muted" variant="caption">
                      {module.summary}
                    </AppText>
                  </YStack>
                  <AppIcon color={palette.muted} name="chevron-right" size={18} />
                </XStack>
              </Card>
            </FadeIn>
          ))}
        </ResponsiveGrid>
      )}
    </Screen>
  );
}

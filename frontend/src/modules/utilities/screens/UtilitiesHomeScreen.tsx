import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';
import { getUtilitiesHome } from '@/modules/utilities/api';
import { matchesSearch } from '@/modules/utilities/utils/utilitiesFormat';

// The hub lists only what GET /api/v1/utilities/home returns. There is no built-in service directory, ratings, or
// prices: those would be invented.

const SHORTCUTS: { icon: AppIconName; label: string; route: Href }[] = [
  { icon: 'package', label: 'Packages', route: '/utilities/packages' as Href },
  { icon: 'map', label: 'Nearby', route: '/utilities/nearby' as Href },
  { icon: 'emergency', label: 'Emergency', route: '/utilities/emergency' as Href },
];

export function UtilitiesHomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const home = useQuery({ queryKey: ['utilities', 'home'], queryFn: getUtilitiesHome });

  const header = (
    <ScreenHeader
      back={{ fallback: '/' as Href }}
      subtitle={home.data?.subtitle || 'Packages, nearby services, and emergency help.'}
      title={home.data?.title || 'Utilities'}
    />
  );

  const shortcuts = (
    <XStack gap="$x3">
      {SHORTCUTS.map((s) => (
        <Card alignItems="center" aria-label={s.label} flex={1} href={s.route} key={s.label}>
          <AppIcon name={s.icon} size={22} />
          <AppText center variant="label">
            {s.label}
          </AppText>
        </Card>
      ))}
    </XStack>
  );

  const body = () => {
    if (home.isLoading) return <LoadingState label="Loading utilities…" />;
    if (home.isError || !home.data) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => home.refetch()}
          retryLabel="Retry"
          title="Unable to load utilities"
        />
      );
    }
    const items = home.data.items.filter((item) =>
      matchesSearch(searchQuery, [item.title, item.body, item.meta]),
    );
    return (
      <YStack gap="$x3">
        <TextField
          aria-label="Search utilities"
          leadingIcon="search"
          onChangeText={setSearchQuery}
          placeholder="Search utilities"
          trailing={
            searchQuery ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => setSearchQuery('')}
                variant="plain"
              />
            ) : undefined
          }
          value={searchQuery}
        />
        {items.length === 0 ? (
          <EmptyState
            actionLabel={searchQuery ? 'Clear search' : undefined}
            body={searchQuery ? 'Try a different search term.' : 'No utilities are listed yet.'}
            compact
            iconName="search"
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
            title="Nothing found"
          />
        ) : (
          <ResponsiveGrid>
            {items.map((item) => (
              <Card
                aria-label={item.title}
                href={item.route ? (item.route as Href) : undefined}
                key={item.id}
              >
                {item.meta ? (
                  <AppText tone="primary" variant="overline">
                    {item.meta}
                  </AppText>
                ) : null}
                <AppText variant="bodyStrong">{item.title}</AppText>
                <AppText tone="muted" variant="body">
                  {item.body}
                </AppText>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => home.refetch()} refreshing={home.isRefetching}>
      {header}
      {shortcuts}
      {body()}
    </Screen>
  );
}

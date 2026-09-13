import { color, space, typography } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { ScreenShell } from '@/modules/shared/components/ScreenShell';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

type Listing = {
  id: string;
  title: string;
  body: string;
  meta?: string;
  route?: string;
};

type MarketplaceSearchContent = {
  title: string;
  subtitle: string;
  eyebrow: string;
  listings: Listing[];
};

export function MarketplaceSearchScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace', 'search', query],
    queryFn: async (): Promise<MarketplaceSearchContent> => {
      const response = await apiFetch(`/api/v1/marketplace/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Marketplace search failed: ${response.status}`);
      return response.json() as Promise<MarketplaceSearchContent>;
    },
  });

  if (isLoading) {
    return (
      <ScreenShell>
        <SectionHeader title="Loading..." />
        <Text style={styles.loadingText}>Searching listings...</Text>
      </ScreenShell>
    );
  }

  if (error || !data) {
    return (
      <ScreenShell>
        <ErrorState
          title="Unable to search listings"
          body="There was a problem searching listings."
          retryLabel="Retry"
          onRetry={() => refetch()}
        />
      </ScreenShell>
    );
  }

  const content = data;
  const filtered = query
    ? content.listings.filter(
        (l) =>
          l.title.toLowerCase().includes(query.toLowerCase()) ||
          l.body.toLowerCase().includes(query.toLowerCase()),
      )
    : content.listings;

  return (
    <ScreenShell>
      <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search listings..." />
      {filtered.length === 0 ? (
        <EmptyState
          title="No listings found"
          body="Try a different search."
          actionLabel="Clear"
          onAction={() => setQuery('')}
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((listing) => (
            <AppButton
              key={listing.id}
              label={listing.title}
              route={listing.route}
              variant="secondary"
            />
          ))}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.x3, marginTop: space.x4 },
  loadingText: { color: color.muted, fontSize: typography.body.fontSize, padding: space.x6 },
});

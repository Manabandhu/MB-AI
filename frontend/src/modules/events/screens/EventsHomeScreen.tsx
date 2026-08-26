import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listEvents } from '@/modules/events/api';
import { eventsScreenFallbacks } from '@/modules/events/eventsFallbacks';
import {
  type CatalogCard,
  CatalogScreen,
  type MetricCardData,
} from '@/modules/shared/components/CatalogScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

export default function EventsHomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', 'home'],
    queryFn: listEvents,
  });

  const fallback = eventsScreenFallbacks.home;
  const events = data ?? fallback.events ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.location.toLowerCase().includes(query.toLowerCase()),
    );
  }, [events, query]);

  const cards: CatalogCard[] = filtered.map((e) => ({
    id: e.id,
    title: e.title,
    body: e.description,
    meta: `${e.date} · ${e.location}`,
    route: `/events/${e.id}`,
  }));

  const metrics: MetricCardData[] = fallback.metrics ?? [];

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load events"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <SectionHeader title={fallback.title} subtitle={fallback.subtitle} />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search events" />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No events found"
              body="Try adjusting your search or browse all events."
              actionLabel="Search"
              onAction={() => router.push('/events/search')}
            />
          ) : (
            <CatalogScreen
              eyebrow={fallback.eyebrow}
              title={fallback.title}
              subtitle={fallback.subtitle}
              metrics={metrics}
              cards={cards}
            />
          )}
          <View style={styles.actions}>
            <AppButton label="Search" route="/events/search" />
            <AppButton label="Saved" route="/events/saved" variant="secondary" />
            <AppButton label="My Events" route="/events/mine" variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

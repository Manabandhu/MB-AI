import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listAdminEvents } from '@/modules/admin/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';

export default function AdminEventsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: listAdminEvents,
  });
  const events = data ?? [];
  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.organizer.toLowerCase().includes(query.toLowerCase()),
    );
  }, [events, query]);

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
          <SectionHeader title="Events" subtitle="Moderate community events." />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search events" />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No events found"
              body="Try adjusting your search."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((e) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/events/${e.id}`)}
                  style={styles.item}
                >
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{e.title}</Text>
                    <Text style={styles.itemSubtitle}>Organizer: {e.organizer}</Text>
                    <Text style={styles.itemMeta}>
                      {e.date} · {e.status} {e.reported ? '· Reported' : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  list: { gap: 12 },
  item: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  itemBody: { gap: 4 },
  itemTitle: { color: color.ink, fontSize: 17, fontWeight: '800', lineHeight: 22 },
  itemSubtitle: { color: color.muted, fontSize: 14, lineHeight: 20 },
  itemMeta: { color: color.primary, fontSize: 12, fontWeight: '700', marginTop: 4 },
});

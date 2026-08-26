import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminScreenFallbacks } from '@/modules/admin/adminFallbacks';
import { listAdminRooms } from '@/modules/admin/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';

export default function AdminRoomsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: listAdminRooms,
  });
  const fallback = adminScreenFallbacks.rooms;
  const rooms = data ?? fallback.rooms ?? [];
  const filtered = useMemo(() => {
    if (!query.trim()) return rooms;
    return rooms.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.hostName.toLowerCase().includes(query.toLowerCase()),
    );
  }, [rooms, query]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load rooms"
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
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search rooms" />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No rooms found"
              body="Try adjusting your search."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/rooms/${r.id}`)}
                  style={styles.item}
                >
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{r.title}</Text>
                    <Text style={styles.itemSubtitle}>Host: {r.hostName}</Text>
                    <Text style={styles.itemMeta}>
                      {r.status} {r.reported ? '· Reported' : ''}
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

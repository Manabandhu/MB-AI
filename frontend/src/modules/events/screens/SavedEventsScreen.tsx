import { radius } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/authStore';
import { listSavedEvents } from '@/modules/events/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';

export default function SavedEventsScreen() {
  const { styles } = useScreenStyles(createScreenStyles);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const authStatus = useAuthStore((st) => st.status);
  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['events', 'saved'],
    queryFn: listSavedEvents,
    // Saved events are personal; the endpoint requires a signed-in member.
    enabled: authStatus === 'authenticated',
  });

  const events = data ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.location.toLowerCase().includes(query.toLowerCase()),
    );
  }, [events, query]);

  if (authStatus === 'unauthenticated') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="Sign in to see your events"
          body="Events you RSVP to are saved to your account."
          actionLabel="Sign in"
          onAction={() => router.push('/sign-in')}
        />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load saved events"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.container}>
          <SectionHeader title="Saved Events" subtitle="Events you RSVPed to or saved" />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search saved events" />
          {isLoading || authStatus === 'loading' ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No saved events"
              body="RSVP to an event and it will appear here."
              actionLabel="Discover events"
              onAction={() => router.push('/events')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((e) => (
                <Pressable
                  key={e.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${e.title}, ${e.location}`}
                  onPress={() => router.push(`/events/${e.id}`)}
                  style={styles.item}
                >
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{e.title}</Text>
                    <Text style={styles.itemSubtitle}>{e.description}</Text>
                    <Text style={styles.itemMeta}>
                      {e.date} · {e.location}
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

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    page: { flexGrow: 1, padding: 16 },
    container: { gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
    list: { gap: 12 },
    item: {
      minHeight: 44,
      minWidth: 44,
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.card,
      borderWidth: 1,
      padding: 16,
      gap: 4,
    },
    itemBody: { gap: 4 },
    itemTitle: { color: palette.ink, fontSize: 17, fontWeight: '800', lineHeight: 22 },
    itemSubtitle: { color: palette.muted, fontSize: 14, lineHeight: 20 },
    itemMeta: { color: palette.primary, fontSize: 12, fontWeight: '700', marginTop: 4 },
  });
};

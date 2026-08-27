import { space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotificationsInbox } from '@/modules/notifications/api';
import { CatalogScreen } from '@/modules/shared/components/CatalogScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#faf8ff' },
  page: { backgroundColor: '#faf8ff', flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
});

export function NotificationsInboxScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', 'inbox'],
    queryFn: getNotificationsInbox,
  });

  const items = data?.items ?? [];
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  }, [items, query]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load notifications"
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
          <SectionHeader
            title="Inbox"
            subtitle="Important updates from rooms, rides, communities, and account safety appear here."
          />
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search notifications"
            accessibilityLabel="Search notifications"
          />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No notifications"
              body="You’re all caught up."
              actionLabel="Explore"
              onAction={() => router.push('/explore')}
            />
          ) : (
            <CatalogScreen
              eyebrow="Notifications"
              title="Inbox"
              subtitle="Important updates from rooms, rides, communities, and account safety appear here."
              metrics={[
                { label: 'Unread', value: String(items.filter((item) => !item.read).length) },
                { label: 'Total', value: String(items.length) },
              ]}
              cards={filtered.map((item) => ({
                id: item.id,
                title: item.title,
                body: item.body,
                meta: item.meta,
                route: `/notifications/${item.id}`,
              }))}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

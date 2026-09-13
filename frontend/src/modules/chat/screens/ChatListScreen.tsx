import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listConversations } from '@/modules/chat/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function ChatListScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: listConversations,
  });

  const conversations = data ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    return conversations.filter((c) => (c.title ?? '').toLowerCase().includes(query.toLowerCase()));
  }, [conversations, query]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load messages"
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
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader title="Messages" subtitle="Direct messages and group chats." />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search conversations" />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No conversations"
              body="Start a new chat to connect."
              actionLabel="New Chat"
              onAction={() => router.push('/chat/new')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open chat with ${c.title ?? ''}`}
                  onPress={() => router.push(`/chat/${c.id}`)}
                  style={styles.item}
                >
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{c.title ?? ''}</Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                      {c.lastMessage ?? ''}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  {(c.unreadCount ?? 0) > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{c.unreadCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.actions}>
            <AppButton label="New Chat" route="/chat/new" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, width: '100%', alignSelf: 'center' },
  list: { gap: 12 },
  item: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: { color: color.ink, fontSize: 17, fontWeight: '800', lineHeight: 22 },
  itemSubtitle: { color: color.muted, fontSize: 14, lineHeight: 20 },
  itemMeta: { color: color.primary, fontSize: 12, fontWeight: '700', marginTop: 4 },
  badge: {
    backgroundColor: color.primary,
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: { color: color.surface, fontSize: 12, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

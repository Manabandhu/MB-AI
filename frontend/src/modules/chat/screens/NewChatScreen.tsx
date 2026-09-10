import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listConversations } from '@/modules/chat/api';
import { chatScreenFallbacks } from '@/modules/chat/chatFallbacks';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { useAdaptiveLayout } from '@/platform/adaptive';

export default function NewChatScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const [query, setQuery] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['chat', 'conversations', 'new'],
    queryFn: listConversations,
  });

  const fallback = chatScreenFallbacks.new;
  const conversations = data ?? fallback.conversations ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    return conversations.filter((c) => (c.title ?? '').toLowerCase().includes(query.toLowerCase()));
  }, [conversations, query]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load contacts"
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
          <SectionHeader title={fallback.title} subtitle={fallback.subtitle} />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search people" />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No contacts found"
              body="Try a different search."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Start chat with ${c.title ?? ''}`}
                  onPress={() => router.push(`/chat/${c.id}`)}
                  style={styles.item}
                >
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{c.title ?? ''}</Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                      {c.lastMessage ?? ''}
                    </Text>
                  </View>
                  <Text style={styles.itemAction}>Message</Text>
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
  itemAction: { color: color.primary, fontSize: 14, fontWeight: '700' },
});

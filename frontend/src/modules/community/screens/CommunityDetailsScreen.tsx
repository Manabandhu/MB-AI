import { color as colors, contentWidth, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCommunity, listPosts } from '@/modules/community/api';
import { communityScreenFallbacks } from '@/modules/community/communityFallbacks';
import { DetailScreen } from '@/modules/shared/components/DetailScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function CommunityDetailsScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const [_postComment, _setPostComment] = useState('');
  const {
    data: community,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['communities', communityId],
    queryFn: () => getCommunity(communityId),
    enabled: !!communityId,
  });
  const { data: posts } = useQuery({
    queryKey: ['communities', communityId, 'posts'],
    queryFn: () => listPosts(communityId),
    enabled: !!communityId,
  });

  const fallback = communityScreenFallbacks.details;
  const title = community?.name ?? fallback.title;
  const subtitle = community?.description ?? fallback.subtitle;
  const postList = posts ?? [];

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load community"
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
        <View style={[styles.container, { maxWidth }]}>
          <DetailScreen
            eyebrow={fallback.eyebrow}
            title={title}
            subtitle={subtitle}
            sections={[]}
            actions={[
              {
                label: 'Create Post',
                onPress: () => router.push(`/community/${communityId}/create-post`),
              },
              { label: 'Join', onPress: () => {}, variant: 'secondary' },
            ]}
          />
          <SectionHeader title="Posts" subtitle={`${postList.length} posts`} />
          {isLoading ? (
            <LoadingState />
          ) : postList.length === 0 ? (
            <EmptyState
              title="No posts yet"
              body="Be the first to post in this community."
              actionLabel="Create Post"
              onAction={() => router.push(`/community/${communityId}/create-post`)}
            />
          ) : (
            <View style={styles.list}>
              {postList.map((post) => (
                <View key={post.id} style={styles.item}>
                  <Text style={styles.itemTitle}>{post.title}</Text>
                  <Text style={styles.itemBody} numberOfLines={2}>
                    {post.body}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {post.authorName} · {post.commentCount} comments
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  list: { gap: space.x3 },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.x4,
    gap: space.x2,
  },
  itemTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  itemBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  itemMeta: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: space.x1 },
});

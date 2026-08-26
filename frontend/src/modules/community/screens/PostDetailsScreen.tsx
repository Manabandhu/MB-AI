import { color as colors, contentWidth, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPost } from '@/modules/community/api';
import { communityScreenFallbacks } from '@/modules/community/communityFallbacks';
import { DetailScreen } from '@/modules/shared/components/DetailScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { TextArea } from '@/modules/shared/components/TextArea';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function PostDetailsScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [comment, setComment] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['communities', 'posts', postId],
    queryFn: () => getPost(postId),
    enabled: !!postId,
  });

  const fallback = communityScreenFallbacks['post-details'];
  const post = data ?? fallback.posts?.[0];

  const comments = useMemo(() => {
    if (!post) return [];
    return [
      { id: 'cm1', authorName: 'Alice', body: 'Great post!', createdAt: post.createdAt },
      { id: 'cm2', authorName: 'Bob', body: 'Thanks for sharing.', createdAt: post.createdAt },
      { id: 'cm3', authorName: 'Carol', body: 'Very helpful.', createdAt: post.createdAt },
    ];
  }, [post]);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load post"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  if (!post && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="Post not found"
          body="This post may have been removed."
          actionLabel="Go back"
          onAction={() => router.back()}
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
            title={post?.title ?? fallback.title}
            subtitle={post?.authorName ?? fallback.subtitle}
            sections={[{ title: 'Post', body: post?.body ?? '' }]}
            actions={[{ label: 'Comment', onPress: () => {}, variant: 'secondary' }]}
          />
          <SectionHeader title="Comments" subtitle={`${comments.length} comments`} />
          {isLoading ? (
            <LoadingState />
          ) : (
            <View style={styles.comments}>
              {comments.map((c) => (
                <View key={c.id} style={styles.comment}>
                  <Text style={styles.commentAuthor}>{c.authorName}</Text>
                  <Text style={styles.commentBody}>{c.body}</Text>
                </View>
              ))}
              <View style={styles.commentBox}>
                <Text style={styles.commentLabel}>Add a comment</Text>
                <TextArea
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Write a comment..."
                  accessibilityLabel="Add a comment"
                />
              </View>
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
  comments: { gap: space.x3 },
  comment: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.x4,
    gap: space.x1,
  },
  commentBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.x4,
    gap: space.x2,
  },
  commentLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  commentAuthor: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  commentBody: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});

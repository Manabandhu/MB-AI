import { color as colors, contentWidth } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCommunity, joinCommunity, leaveCommunity, listPosts } from '@/modules/community/api';
import { DetailScreen } from '@/modules/shared/components/DetailScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function CommunityDetailsScreen() {
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const maxWidth = layout.windowClass === 'compact' ? contentWidth.compact : layout.maxContentWidth;
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const [joined, setJoined] = useState(false);

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

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['communities', communityId, 'posts'],
    queryFn: () => listPosts(communityId),
    enabled: !!communityId,
  });

  const handleToggleJoin = async () => {
    try {
      if (joined) {
        await leaveCommunity(communityId);
        setJoined(false);
        Alert.alert('Left Community', `You left ${community?.name ?? 'the community'}.`);
      } else {
        await joinCommunity(communityId);
        setJoined(true);
        Alert.alert('Joined!', `Welcome to ${community?.name ?? 'the community'}!`);
      }
    } catch {
      setJoined((prev) => !prev);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !community) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          body="Please check your connection and try again."
          onRetry={refetch}
          retryLabel="Retry"
          title="Unable to load community"
        />
      </SafeAreaView>
    );
  }

  const postList = posts ?? [];
  const memberCount = (community.memberCount || 0) + (joined ? 1 : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth }]}>
          {/* Header */}
          <DetailScreen
            actions={[
              {
                label: 'Create Post',
                onPress: () =>
                  router.push(`/community/create-post?communityId=${communityId}` as Href),
              },
              {
                label: joined ? '✓ Joined' : '+ Join Community',
                onPress: handleToggleJoin,
                variant: joined ? 'secondary' : 'primary',
              },
            ]}
            eyebrow={`${community.category || 'City'} Space • 👥 ${memberCount} Members`}
            sections={[]}
            subtitle={community.description}
            title={community.name}
          />

          <SectionHeader
            subtitle={`${postList.length} active discussions`}
            title="Community Feed"
          />
          {postsLoading ? (
            <LoadingState />
          ) : postList.length === 0 ? (
            <EmptyState
              actionLabel="Create Post"
              body="Be the first to share an update, sublease, or question in this space."
              onAction={() =>
                router.push(`/community/create-post?communityId=${communityId}` as Href)
              }
              title="No posts yet"
            />
          ) : (
            <View style={styles.list}>
              {postList.map((post) => (
                <Pressable
                  accessibilityLabel={post.title}
                  accessibilityRole="button"
                  key={post.id}
                  onPress={() => router.push(`/community/post/${post.id}` as Href)}
                  style={styles.item}
                >
                  <Text style={styles.itemTitle}>{post.title}</Text>
                  <Text numberOfLines={3} style={styles.itemBody}>
                    {post.body}
                  </Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemMeta}>
                      {post.authorName || 'Member'} · {post.commentCount ?? 0} comments
                    </Text>
                    <Text style={styles.likeCount}>❤️ {post.likeCount ?? 0}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <AppButton
              label="Explore All Communities"
              onPress={() => router.push('/community')}
              variant="secondary"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, width: '100%', alignSelf: 'center' },
  list: { gap: 12 },
  item: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  itemBody: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemMeta: { fontSize: 12, color: '#6b7280' },
  likeCount: { fontSize: 12, color: '#6b7280' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
});

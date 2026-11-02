import { formatNumber } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { FEED_LIMIT, getCommunity, listPosts } from '@/modules/community/api';
import { PostCard } from '@/modules/community/components/PostCard';
import { useMembershipToggle } from '@/modules/community/hooks';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/** A community: what it is, join/leave, and its posts. */
export function CommunityDetailsScreen() {
  const router = useRouter();
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const membership = useMembershipToggle();

  const communityQuery = useQuery({
    queryKey: ['communities', communityId],
    queryFn: () => getCommunity(communityId),
    enabled: Boolean(communityId),
  });
  const postsQuery = useQuery({
    queryKey: ['communities', communityId, 'posts'],
    queryFn: () => listPosts(communityId),
    enabled: Boolean(communityId),
  });

  if (communityQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/community" />
        <LoadingState label="Loading community…" />
      </Screen>
    );
  }

  if (communityQuery.isError || !communityQuery.data) {
    const notFound = (communityQuery.error as { status?: number } | null)?.status === 404;
    return (
      <Screen>
        <BackButton fallback="/community" />
        <ErrorState
          body={notFound ? 'This community no longer exists.' : errorText(communityQuery.error)}
          onRetry={notFound ? undefined : () => communityQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Community not found' : 'Could not load community'}
        />
      </Screen>
    );
  }

  const community = communityQuery.data;
  const posts = postsQuery.data ?? [];
  const createPostRoute = `/community/create-post?communityId=${community.id}` as Href;
  const members = `${formatNumber(community.memberCount)} ${community.memberCount === 1 ? 'member' : 'members'}`;

  const onToggle = () => {
    if (!signedIn) {
      router.push('/sign-in' as Href);
      return;
    }
    membership.toggle(community);
  };

  return (
    <Screen
      onRefresh={() => Promise.all([communityQuery.refetch(), postsQuery.refetch()])}
      refreshing={communityQuery.isRefetching || postsQuery.isRefetching}
    >
      <YStack gap="$x4">
        <ScreenHeader
          back={{ fallback: '/community' as Href }}
          subtitle={[community.metroArea, members].filter(Boolean).join(' · ')}
          title={community.name}
        />
        <XStack alignItems="center" flexWrap="wrap" gap="$x2">
          {community.category ? (
            <StatusBadge label={categoryLabel(community.category)} tone="info" />
          ) : null}
          {community.isJoined ? <StatusBadge label="Joined" tone="success" /> : null}
        </XStack>
        {community.description ? <AppText>{community.description}</AppText> : null}
        <XStack flexWrap="wrap" gap="$x3">
          <AppButton
            disabled={membership.pendingId === community.id}
            label={community.isJoined ? 'Leave' : 'Join community'}
            loading={membership.pendingId === community.id}
            onPress={onToggle}
            variant={community.isJoined ? 'secondary' : 'primary'}
          />
          {community.isJoined ? (
            <AppButton
              icon="plus"
              label="Create post"
              onPress={() => router.push(createPostRoute)}
              variant="secondary"
            />
          ) : null}
        </XStack>

        <Heading variant="h4">Posts</Heading>
        {postsQuery.isLoading ? (
          <LoadingState count={3} label="Loading posts…" variant="skeleton" />
        ) : postsQuery.isError ? (
          <ErrorState
            body={errorText(postsQuery.error)}
            compact
            onRetry={() => postsQuery.refetch()}
            retryLabel="Retry"
            title="Could not load posts"
          />
        ) : posts.length === 0 ? (
          <EmptyState
            actionLabel={community.isJoined ? 'Create post' : undefined}
            body={
              community.isJoined
                ? 'Be the first to share an update or ask a question here.'
                : 'Join to start the first conversation here.'
            }
            iconName="message"
            onAction={community.isJoined ? () => router.push(createPostRoute) : undefined}
            title="No posts yet"
          />
        ) : (
          <YStack gap="$x3">
            {posts.length >= FEED_LIMIT ? (
              <AppText tone="muted" variant="caption">
                Showing the latest {FEED_LIMIT} posts.
              </AppText>
            ) : null}
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </YStack>
        )}
      </YStack>
    </Screen>
  );
}

/** The server stores categories enum-style (`CITY`, `CAMPUS`); show them as words. */
function categoryLabel(category: string): string {
  const text = category.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

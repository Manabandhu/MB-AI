import { formatRelative } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import {
  addComment,
  COMMUNITY_QUERY_PREFIXES,
  getPost,
  listComments,
  type Post,
  type ReactionType,
  reactPost,
  unreactPost,
} from '@/modules/community/api';
import { nextReaction, REACTIONS, withViewerReaction } from '@/modules/community/utils/reactions';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { errorText, showError, showMessage } from '@/modules/shared/ui/notify';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

const COMMENT_MAX = 4000;

/** One post with live reactions (yours is highlighted; tap it again to remove it), comments, and sharing. */
export function PostDetailsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const postKey = ['community', 'post', postId] as const;
  const postQuery = useQuery({
    queryKey: postKey,
    queryFn: () => getPost(String(postId)),
    enabled: Boolean(postId),
  });
  const commentsQuery = useQuery({
    queryKey: ['community', 'post', postId, 'comments'],
    queryFn: () => listComments(String(postId)),
    enabled: Boolean(postId),
  });

  const refreshCommunity = () =>
    Promise.all(
      COMMUNITY_QUERY_PREFIXES.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const reactionMutation = useMutation({
    mutationFn: (next: ReactionType | null) =>
      next ? reactPost(String(postId), next) : unreactPost(String(postId)),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: postKey });
      const previous = queryClient.getQueryData<Post>(postKey);
      if (previous) queryClient.setQueryData(postKey, withViewerReaction(previous, next));
      return { previous };
    },
    onError: (error, _next, context) => {
      if (context?.previous) queryClient.setQueryData(postKey, context.previous);
      showError('Could not update your reaction', error);
    },
    onSettled: refreshCommunity,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => addComment(String(postId), text),
    onSuccess: () => {
      setCommentText('');
      setCommentError(null);
      return refreshCommunity();
    },
    onError: (error) => setCommentError(errorText(error, 'Your comment was not posted.')),
  });

  const requireSignIn = () => {
    if (signedIn) return true;
    router.push('/sign-in' as Href);
    return false;
  };

  const onReact = (type: ReactionType) => {
    const post = postQuery.data;
    if (!post || !requireSignIn() || reactionMutation.isPending) return;
    reactionMutation.mutate(nextReaction(post.viewerReaction, type));
  };

  const onSend = () => {
    if (!requireSignIn()) return;
    const text = commentText.trim();
    if (!text) {
      setCommentError('Write a comment first.');
      return;
    }
    commentMutation.mutate(text);
  };

  const onShare = async () => {
    const post = postQuery.data;
    if (!post) return;
    try {
      const result = await shareLink(`/community/posts/${post.id}`, post.title);
      if (result === 'copied') showMessage('Link copied', 'The post link is on your clipboard.');
    } catch (error) {
      showError('Could not share this post', error);
    }
  };

  if (postQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/community" />
        <LoadingState label="Loading post…" />
      </Screen>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    const status = (postQuery.error as { status?: number } | null)?.status;
    const notFound = status === 404;
    return (
      <Screen>
        <BackButton fallback="/community" />
        <ErrorState
          body={notFound ? 'This post was removed.' : errorText(postQuery.error)}
          onRetry={notFound ? undefined : () => postQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Post not found' : 'Could not load this post'}
        />
      </Screen>
    );
  }

  const post = postQuery.data;
  const comments = commentsQuery.data ?? [];
  const backTo = (post.communityId ? `/community/${post.communityId}` : '/community') as Href;

  return (
    <Screen
      keyboardAvoiding
      onRefresh={() => Promise.all([postQuery.refetch(), commentsQuery.refetch()])}
      refreshing={postQuery.isRefetching || commentsQuery.isRefetching}
    >
      <YStack gap="$x4">
        <ScreenHeader
          actions={<IconButton icon="share" label="Share post" onPress={onShare} />}
          back={{ fallback: backTo }}
          title="Post"
        />

        <PersonRow name={post.authorName} subtitle={formatRelative(post.createdAt) ?? undefined} />

        <Card gap="$x3">
          <Heading variant="h3">{post.title}</Heading>
          <AppText selectable>{post.body}</AppText>
        </Card>

        <FilterChipRow label="Reactions">
          {REACTIONS.map((reaction) => (
            <Chip
              accessibilityLabel={`${reaction.label}, ${post.reactionCounts[reaction.type] ?? 0}`}
              count={post.reactionCounts[reaction.type] ?? 0}
              key={reaction.type}
              label={reaction.label}
              onPress={() => onReact(reaction.type)}
              selected={post.viewerReaction === reaction.type}
            />
          ))}
        </FilterChipRow>

        <YStack gap="$x3">
          <Heading variant="h4">
            Comments{commentsQuery.data ? ` (${comments.length})` : ''}
          </Heading>

          <Card gap="$x2">
            <TextField
              accessibilityLabel="Write a comment"
              error={commentError}
              maxLength={COMMENT_MAX}
              multiline
              onChangeText={(text) => {
                setCommentText(text);
                if (commentError) setCommentError(null);
              }}
              placeholder={signedIn ? 'Add to the conversation' : 'Sign in to comment'}
              value={commentText}
            />
            <XStack justifyContent="flex-end">
              <AppButton
                disabled={commentMutation.isPending}
                label={signedIn ? 'Post comment' : 'Sign in to comment'}
                loading={commentMutation.isPending}
                onPress={onSend}
                size="sm"
              />
            </XStack>
          </Card>

          {commentsQuery.isLoading ? (
            <LoadingState label="Loading comments…" />
          ) : commentsQuery.isError ? (
            <ErrorState
              body={errorText(commentsQuery.error)}
              compact
              onRetry={() => commentsQuery.refetch()}
              retryLabel="Retry"
              title="Could not load comments"
            />
          ) : comments.length === 0 ? (
            <EmptyState
              body="Be the first to reply."
              compact
              iconName="message"
              title="No comments yet"
            />
          ) : (
            comments.map((comment) => (
              <PersonRow
                detail={<AppText selectable>{comment.body}</AppText>}
                key={comment.id}
                name={comment.authorName}
                subtitle={formatRelative(comment.createdAt) ?? undefined}
              />
            ))
          )}
        </YStack>
      </YStack>
    </Screen>
  );
}

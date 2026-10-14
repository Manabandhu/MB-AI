import { formatRelative } from '@manabandhu/core';
import type { Href } from 'expo-router';
import { XStack } from 'tamagui';
import type { Post } from '@/modules/community/api';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';

/** A post in a feed: title, excerpt, author, and the live comment and reaction counts. Opens the post. */
export function PostCard({ post }: { post: Post }) {
  const when = formatRelative(post.createdAt);
  const comments = `${post.commentCount} ${post.commentCount === 1 ? 'comment' : 'comments'}`;
  const reactions = `${post.reactionCount} ${post.reactionCount === 1 ? 'reaction' : 'reactions'}`;
  return (
    <Card aria-label={post.title} href={`/community/posts/${post.id}` as Href}>
      <Heading numberOfLines={2} variant="h4">
        {post.title}
      </Heading>
      <AppText numberOfLines={3} tone="muted">
        {post.body}
      </AppText>
      <XStack columnGap="$x3" flexWrap="wrap" rowGap="$x1">
        <AppText tone="muted" variant="caption">
          {[post.authorName, when].filter(Boolean).join(' · ')}
        </AppText>
        <AppText tone="muted" variant="caption">
          {comments} · {reactions}
        </AppText>
      </XStack>
    </Card>
  );
}

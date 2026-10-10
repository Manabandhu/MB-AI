import { formatRelative } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { WidgetFrame } from '@/modules/shared/components/WidgetFrame';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { listPosts } from '../api';

/** Latest community posts. */
export function CommunityHomeWidget() {
  const query = useQuery({
    queryKey: ['community', 'home-widget'],
    queryFn: () => listPosts(),
    staleTime: 60_000,
  });
  const posts = (query.data ?? []).slice(0, 3);
  return (
    <WidgetFrame
      empty={{
        title: 'No posts yet',
        body: 'Ask a question or share a tip with people nearby.',
        actionLabel: 'Create a post',
        actionHref: '/community/create-post',
      }}
      icon="community"
      isEmpty={posts.length === 0}
      isError={query.isError}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/community' }}
      title="From the community"
    >
      {posts.map((post) => (
        <ListRow
          href={`/community/posts/${post.id}`}
          icon="message"
          key={post.id}
          meta={formatRelative(post.createdAt)}
          subtitle={post.body}
          title={post.title}
        />
      ))}
    </WidgetFrame>
  );
}

import { formatRelative } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { XStack } from 'tamagui';
import { useT } from '@/i18n';
import { listPosts } from '@/modules/community';
import { useShellContent } from '@/modules/foundation/shell/shellApi';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Chip } from '@/modules/shared/ui/Chip';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { FadeIn } from '@/modules/shared/ui/motion/FadeIn';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { Section } from '@/modules/shared/ui/Section';
import { SkeletonCard } from '@/modules/shared/ui/Skeleton';
import { TabHeader } from '../TabHeader';

/** Community tab: live group/post counts, shortcuts to groups, and the latest posts. */
export function CommunityTab() {
  const t = useT();
  const shell = useShellContent('community');
  const posts = useQuery({ queryKey: ['community', 'posts', 'all'], queryFn: () => listPosts() });

  return (
    <Screen
      onRefresh={() => Promise.all([shell.refetch(), posts.refetch()])}
      refreshing={posts.isRefetching}
    >
      <Head>
        <title>Community · ManaBandhu</title>
      </Head>
      <TabHeader
        actions={
          <AppButton
            icon="plus"
            label="Post"
            onPress={() => router.push('/community/create-post')}
            size="sm"
          />
        }
        subtitle={t('tabSubtitles.community')}
        title={t('tabs.community')}
      />
      <XStack flexWrap="wrap" gap="$x2">
        <Chip
          icon="compass"
          label="Discover groups"
          onPress={() => router.push('/community/discover')}
        />
        <Chip icon="community" label="My groups" onPress={() => router.push('/community/joined')} />
        <Chip icon="event" label="Events" onPress={() => router.push('/events')} />
        {(shell.data?.metrics ?? []).map((metric) => (
          <AppText alignSelf="center" key={metric.label} tone="muted" variant="caption">
            {metric.value} {metric.label.toLowerCase()}
          </AppText>
        ))}
      </XStack>
      <Section title="Latest posts">
        {posts.isLoading ? (
          <SkeletonCard />
        ) : posts.isError ? (
          <ErrorState
            body="Posts could not load right now."
            onRetry={() => posts.refetch()}
            title="Couldn't load posts"
          />
        ) : (posts.data ?? []).length === 0 ? (
          <EmptyState
            actionLabel="Create the first post"
            body="Ask a question or share a tip with the community."
            iconName="community"
            onAction={() => router.push('/community/create-post')}
            title="No posts yet"
          />
        ) : (
          <ResponsiveGrid columns={{ compact: 1, medium: 1, expanded: 2, wide: 2 }} gap={12}>
            {(posts.data ?? []).map((post, index) => (
              <FadeIn index={index} key={post.id}>
                <ListRow
                  href={`/community/posts/${post.id}`}
                  icon="message"
                  meta={formatRelative(post.createdAt)}
                  subtitle={post.body}
                  title={post.title}
                />
              </FadeIn>
            ))}
          </ResponsiveGrid>
        )}
      </Section>
    </Screen>
  );
}

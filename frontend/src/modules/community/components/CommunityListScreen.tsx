import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { listCommunities } from '@/modules/community/api';
import { CommunityRow } from '@/modules/community/components/CommunityRow';
import { useMembershipToggle } from '@/modules/community/hooks';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

const COPY = {
  discover: {
    title: 'Discover communities',
    subtitle: 'Find and join cultural, professional, and student circles.',
    search: 'Search communities',
    emptyTitle: 'No communities yet',
    emptyBody: 'Check back soon.',
  },
  joined: {
    title: 'My communities',
    subtitle: 'Communities you joined.',
    search: 'Search my communities',
    emptyTitle: 'No joined communities',
    emptyBody: 'Join communities to see them here.',
  },
} as const;

/** Community list with search; rows open the community and join/leave in place. */
export function CommunityListScreen({ mode }: { mode: 'discover' | 'joined' }) {
  const router = useRouter();
  const copy = COPY[mode];
  const [query, setQuery] = useState('');
  const membership = useMembershipToggle();
  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list'],
    queryFn: listCommunities,
  });

  const filtered = useMemo(() => {
    const all = (communitiesQuery.data ?? []).filter((c) => mode === 'discover' || c.isJoined);
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((c) =>
      [c.name, c.description, c.metroArea].some((field) => field?.toLowerCase().includes(needle)),
    );
  }, [communitiesQuery.data, mode, query]);

  const body = () => {
    if (communitiesQuery.isLoading) {
      return <LoadingState count={4} label="Loading communities…" variant="skeleton" />;
    }
    if (communitiesQuery.isError) {
      return (
        <ErrorState
          body={errorText(communitiesQuery.error)}
          onRetry={() => communitiesQuery.refetch()}
          retryLabel="Retry"
          title="Could not load communities"
        />
      );
    }
    if (filtered.length === 0) {
      if (query.trim()) {
        return (
          <EmptyState
            actionLabel="Clear search"
            body="Try a different name or city."
            onAction={() => setQuery('')}
            title="No matches"
          />
        );
      }
      return (
        <EmptyState
          actionLabel={mode === 'joined' ? 'Discover communities' : undefined}
          body={copy.emptyBody}
          iconName="community"
          onAction={
            mode === 'joined' ? () => router.push('/community/discover' as Href) : undefined
          }
          title={copy.emptyTitle}
        />
      );
    }
    return (
      <YStack gap="$x3">
        {filtered.map((community) => (
          <CommunityRow
            community={community}
            key={community.id}
            onToggle={() => membership.toggle(community)}
            pending={membership.pendingId === community.id}
          />
        ))}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => communitiesQuery.refetch()} refreshing={communitiesQuery.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          back={{ fallback: '/community' as Href }}
          subtitle={copy.subtitle}
          title={copy.title}
        />
        <TextField
          accessibilityLabel={copy.search}
          leadingIcon="search"
          onChangeText={setQuery}
          placeholder={copy.search}
          returnKeyType="search"
          value={query}
        />
        {body()}
      </YStack>
    </Screen>
  );
}

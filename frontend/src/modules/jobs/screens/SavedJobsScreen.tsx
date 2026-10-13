import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { getJobPosting } from '@/modules/jobs/api';
import { useSavedJobsStore } from '@/modules/jobs/savedJobsStore';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

const PAGE_SIZE = 12;

/** Resolve saved IDs directly so older bookmarks do not disappear outside the newest jobs page. */
export function SavedJobsScreen() {
  const ids = useSavedJobsStore((state) => state.ids);
  const toggle = useSavedJobsStore((state) => state.toggle);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = ids.slice(0, limit);
  const queries = useQueries({
    queries: visible.map((id) => ({
      queryKey: ['jobs', 'detail', id],
      queryFn: () => getJobPosting(id),
      staleTime: 120_000,
      retry: 1,
    })),
  });
  return (
    <Screen
      onRefresh={() => {
        void Promise.all(queries.map((query) => query.refetch()));
      }}
      refreshing={queries.some((query) => query.isRefetching)}
    >
      <ScreenHeader
        title="Saved jobs"
        subtitle="Your job bookmarks, saved on this device."
        back={{ fallback: '/jobs' }}
        primaryAction={{ label: 'Find jobs', icon: 'search', route: '/jobs' }}
      />
      {!ids.length ? (
        <EmptyState
          title="Keep your next opportunity close"
          body="Tap the heart on a job to save it here. Your bookmarks stay on this device."
          iconName="heart"
          actionLabel="Browse jobs"
          onAction={() => router.push('/jobs')}
        />
      ) : (
        <YStack gap="$x3">
          {visible.map((id, index) => {
            const query = queries[index];
            if (query.isPending)
              return (
                <LoadingState key={id} variant="skeleton" count={1} label="Loading saved job" />
              );
            if (query.isError || !query.data)
              return (
                <Card key={id}>
                  <ErrorState
                    compact
                    title="This saved job couldn't load"
                    body="It may no longer be available. Retry, or remove this bookmark."
                    onRetry={() => void query.refetch()}
                  />
                  <AppButton label="Remove bookmark" variant="ghost" onPress={() => toggle(id)} />
                </Card>
              );
            const job = query.data;
            return (
              <Card key={id}>
                <XStack alignItems="center" gap="$x3">
                  <YStack flex={1} minWidth={0} gap="$x1">
                    <AppText variant="h3">{job.title}</AppText>
                    <AppText tone="muted">
                      {[job.company, job.location].filter(Boolean).join(' · ')}
                    </AppText>
                  </YStack>
                  <IconButton
                    icon="heart"
                    label={`Remove ${job.title} from saved jobs`}
                    onPress={() => toggle(id)}
                    variant="solid"
                  />
                </XStack>
                <AppButton
                  label="View opportunity"
                  iconAfter="arrow-right"
                  variant="secondary"
                  route={`/jobs/${id}`}
                />
              </Card>
            );
          })}
          {limit < ids.length ? (
            <AppButton
              label="Load more saved jobs"
              variant="secondary"
              onPress={() => setLimit((value) => value + PAGE_SIZE)}
            />
          ) : null}
        </YStack>
      )}
    </Screen>
  );
}

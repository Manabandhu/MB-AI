import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { getImmigrationResource } from '@/modules/immigration/api';
import { openUrl } from '@/modules/immigration/utils/openUrl';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { errorText } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

type ResourceDetailScreenProps = {
  resourceId: string;
};

/** One immigration resource (`GET /api/v1/immigration/resources/{id}`) with its link opened in the browser. */
export function ResourceDetailScreen({ resourceId }: ResourceDetailScreenProps) {
  const resourceQuery = useQuery({
    queryKey: ['immigration', 'resource', resourceId],
    queryFn: () => getImmigrationResource(resourceId),
    enabled: Boolean(resourceId),
  });

  if (resourceQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/immigration/resources" />
        <LoadingState label="Loading resource…" />
      </Screen>
    );
  }

  const resource = resourceQuery.data;
  if (resourceQuery.isError || !resource) {
    const notFound = (resourceQuery.error as { status?: number } | null)?.status === 404;
    return (
      <Screen>
        <BackButton fallback="/immigration/resources" />
        <ErrorState
          body={notFound ? 'This resource was removed.' : errorText(resourceQuery.error)}
          onRetry={notFound ? undefined : () => resourceQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Resource not found' : 'Could not load this resource'}
        />
      </Screen>
    );
  }

  const link = resource.url && /^https?:\/\//i.test(resource.url) ? resource.url : null;

  return (
    <Screen onRefresh={() => resourceQuery.refetch()} refreshing={resourceQuery.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          back={{ fallback: '/immigration/resources' as Href }}
          subtitle={resource.category ?? undefined}
          title="Resource"
        />
        <Card gap="$x3">
          <Heading variant="h3">{resource.title}</Heading>
          <XStack flexWrap="wrap" gap="$x2">
            {resource.resourceType ? (
              <StatusBadge
                label={
                  resource.resourceType.charAt(0) +
                  resource.resourceType.slice(1).toLowerCase().replace(/_/g, ' ')
                }
                tone="primary"
              />
            ) : null}
            {resource.verified ? (
              <StatusBadge icon="verified-user" label="Reviewed by admin" tone="success" />
            ) : (
              <StatusBadge label="Not reviewed yet" tone="warning" />
            )}
          </XStack>
          {resource.description ? (
            <AppText selectable>{resource.description}</AppText>
          ) : (
            <AppText tone="muted">No description was added.</AppText>
          )}
          <AppText tone="muted" variant="caption">
            Added {formatDate(resource.createdAt) ?? ''}
          </AppText>
        </Card>
        {link ? (
          <Card gap="$x2">
            <AppText numberOfLines={2} selectable tone="muted" variant="caption">
              {link}
            </AppText>
            <XStack>
              <AppButton icon="globe" label="Open link" onPress={() => openUrl(link)} />
            </XStack>
          </Card>
        ) : null}
        <AppText tone="muted" variant="caption">
          Resources are shared for information only and are not legal advice.
        </AppText>
      </YStack>
    </Screen>
  );
}

import { useQuery } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { getAssistantCitations } from '@/modules/ai-assistant/api';
import { safeExternalUrl } from '@/modules/ai-assistant/assistantFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';

const openUrl = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    showError('Could not open the link', error);
  }
};

/** Sources attached to answers in your latest conversation; each one with a web link opens it. */
export function AssistantCitationsScreen() {
  const router = useRouter();
  const citations = useQuery({
    queryKey: ['assistant', 'citations'],
    queryFn: getAssistantCitations,
  });

  const body = () => {
    if (citations.isLoading) return <LoadingState count={4} variant="skeleton" />;
    if (citations.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => citations.refetch()}
          retryLabel="Retry"
          title="Unable to load citations"
        />
      );
    }
    const data = citations.data ?? [];
    if (data.length === 0) {
      return (
        <EmptyState
          actionLabel="Open assistant"
          body="Sources the assistant uses for its answers will appear here."
          iconName="book"
          onAction={() => router.push('/assistant' as Href)}
          title="No citations"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {data.map((item) => {
          const url = safeExternalUrl(item.url);
          return (
            <Card
              aria-label={url ? `Open ${item.title}` : undefined}
              key={item.id}
              onPress={url ? () => void openUrl(url) : undefined}
            >
              <XStack alignItems="center" gap="$x2">
                <AppIcon name="book" size={20} />
                <AppText flex={1} variant="bodyStrong">
                  {item.title}
                </AppText>
                {url ? <AppIcon name="arrow-right" size={18} /> : null}
              </XStack>
              {item.snippet || item.body ? (
                <AppText tone="muted" variant="body">
                  {item.snippet ?? item.body}
                </AppText>
              ) : null}
              {url || item.source ? (
                <AppText numberOfLines={1} tone="primary" variant="caption">
                  {item.source ?? url}
                </AppText>
              ) : null}
            </Card>
          );
        })}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => citations.refetch()} refreshing={citations.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/assistant' as Href }}
        subtitle="Sources used for answers in your latest conversation."
        title="Citations"
      />
      {body()}
    </Screen>
  );
}

import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { Linking } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { getEmergencyResources } from '@/modules/utilities/api';
import { mapsSearchUrl, telLink } from '@/modules/utilities/utilitiesFormat';

const open = async (url: string, what: string) => {
  try {
    await Linking.openURL(url);
  } catch (error) {
    showError(`Could not open ${what}`, error);
  }
};

/** 911 first, then the directory's crisis and aid resources, each with call and directions actions. */
export function EmergencyResourcesScreen() {
  const resources = useQuery({
    queryKey: ['utilities', 'emergency'],
    queryFn: getEmergencyResources,
  });

  const body = () => {
    if (resources.isLoading) return <LoadingState count={4} variant="skeleton" />;
    if (resources.isError) {
      return (
        <ErrorState
          body="Check your connection and try again. In an emergency, call 911."
          onRetry={() => resources.refetch()}
          retryLabel="Retry"
          title="Unable to load emergency resources"
        />
      );
    }
    const data = resources.data ?? [];
    if (data.length === 0) {
      return (
        <EmptyState
          body="No local resources have been added yet. In an emergency, call 911."
          iconName="emergency"
          title="No resources listed"
        />
      );
    }
    return (
      <YStack gap="$x3">
        {data.map((item) => {
          const tel = telLink(item.phone);
          return (
            <Card key={item.id}>
              {item.category ? <StatusBadge label={item.category} tone="danger" /> : null}
              <AppText variant="bodyStrong">{item.name}</AppText>
              <AppText tone="muted" variant="body">
                {item.description}
              </AppText>
              <AppText tone="muted" variant="caption">
                {[item.address, item.hours].filter(Boolean).join(' · ')}
              </AppText>
              <XStack flexWrap="wrap" gap="$x2">
                {tel ? (
                  <AppButton
                    icon="phone"
                    label={`Call ${item.phone}`}
                    onPress={() => void open(tel, 'the phone app')}
                    size="sm"
                  />
                ) : null}
                {item.address ? (
                  <AppButton
                    icon="map-pin"
                    label="Directions"
                    onPress={() => void open(mapsSearchUrl(item.address), 'maps')}
                    size="sm"
                    variant="secondary"
                  />
                ) : null}
              </XStack>
            </Card>
          );
        })}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => resources.refetch()} refreshing={resources.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/utilities' as Href }}
        subtitle="Crisis support and local aid."
        title="Emergency resources"
      />
      <Card backgroundColor="$errorBg" borderColor="$error">
        <AppText role="heading" variant="h4">
          In immediate danger?
        </AppText>
        <AppText variant="body">Call 911 or your local emergency number first.</AppText>
        <AppButton
          icon="phone"
          label="Call 911"
          onPress={() => void open('tel:911', 'the phone app')}
          size="lg"
          variant="danger"
        />
      </Card>
      {body()}
    </Screen>
  );
}

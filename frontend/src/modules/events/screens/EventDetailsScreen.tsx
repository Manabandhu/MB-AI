import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getEvent } from '@/modules/events/api';
import { eventsScreenFallbacks } from '@/modules/events/eventsFallbacks';
import { DetailScreen } from '@/modules/shared/components/DetailScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';

export default function EventDetailsScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !!eventId,
  });

  const fallback = eventsScreenFallbacks.details;
  const event = data ?? fallback.events?.[0];

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load event"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  if (!event && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="Event not found"
          body="This event may have been removed."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <DetailScreen
            eyebrow={fallback.eyebrow}
            title={event?.title ?? fallback.title}
            subtitle={event?.description ?? fallback.subtitle}
            sections={[
              { title: 'Location', body: event?.location ?? '' },
              { title: 'Organizer', body: event?.organizer ?? '' },
              { title: 'Category', body: event?.category ?? '' },
            ]}
            actions={[
              { label: event?.isSaved ? 'Saved' : 'Save', onPress: () => {}, variant: 'secondary' },
              { label: 'Create Event', onPress: () => router.push('/events/create') },
            ]}
          />
          <SectionHeader title="Attendees" subtitle={`${event?.attendeeCount ?? 0} attending`} />
          {isLoading ? (
            <LoadingState />
          ) : (
            <View style={styles.attendees}>
              <Text style={styles.attendeeText}>Attendee list would load here.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  attendees: { gap: 12 },
  attendeeText: { color: color.muted, fontSize: 14, lineHeight: 20 },
});

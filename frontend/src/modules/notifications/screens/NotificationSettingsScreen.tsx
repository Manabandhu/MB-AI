import { color as colors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotificationSettings } from '@/modules/notifications/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function NotificationSettingsScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: getNotificationSettings,
    retry: false,
  });

  const preferences = data?.preferences ?? {};
  const prefEntries = Object.entries(preferences);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Notifications</Text>
          <Text style={styles.title}>Notification preferences</Text>
          <Text style={styles.subtitle}>
            Choose which updates you receive across rooms, rides, communities, and account safety.
          </Text>
          {isLoading ? (
            <LoadingState label="Loading preferences..." />
          ) : error ? (
            <ErrorState
              title="Unable to load preferences"
              body="There was an error retrieving your notification preferences."
              retryLabel="Retry"
              onRetry={() => {
                void refetch();
              }}
            />
          ) : prefEntries.length > 0 ? (
            prefEntries.map(([channel, enabled]) => (
              <View key={channel} style={styles.card}>
                <Text style={styles.cardTitle}>{channel}</Text>
                <Text style={styles.cardBody}>{enabled ? 'Enabled' : 'Disabled'}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Notification Channels</Text>
                <Text style={styles.cardBody}>
                  In-app notifications are active for all community modules and messages.
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Quiet Hours</Text>
                <Text style={styles.cardBody}>
                  Standard quiet hours (10:00 PM – 7:00 AM) are in effect for non-urgent alerts.
                </Text>
              </View>
            </>
          )}
          <AppButton label="Back to inbox" route="/notifications" variant="secondary" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', lineHeight: 24 },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
});

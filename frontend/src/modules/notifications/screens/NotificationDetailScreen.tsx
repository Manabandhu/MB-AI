import { color as colors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotificationDetail } from '@/modules/notifications/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function NotificationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: notification,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', 'detail', id],
    queryFn: () => getNotificationDetail(id!),
    enabled: !!id,
    retry: false,
  });

  if (isLoading) {
    return <LoadingState label="Loading notification..." />;
  }

  if (error || !notification) {
    return (
      <ErrorState
        title="Notification not found"
        body="Unable to load this notification. It may have been deleted or expired."
        retryLabel="Back to inbox"
        onRetry={() => router.push('/notifications')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Notification</Text>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.subtitle}>{notification.meta}</Text>
          <View style={styles.card}>
            <Text style={styles.cardBody}>{notification.body}</Text>
            <View style={styles.badgeRow}>
              <Text style={notification.read ? styles.readBadge : styles.unreadBadge}>
                {notification.read ? 'Read' : 'New'}
              </Text>
            </View>
          </View>
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
    gap: space.x3,
    padding: space.x4,
  },
  cardBody: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  badgeRow: { flexDirection: 'row', marginTop: space.x2 },
  unreadBadge: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: space.x2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  readBadge: {
    backgroundColor: '#F3F4F6',
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: space.x2,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});

import { color as colors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBlockedUsers, unblockUser } from '@/modules/safety/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { SwipeAction } from '@/modules/shared/components/SwipeAction';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

/** Short, stable label until the app has a profile directory; never an invented name. */
const memberLabel = (userId: string) => `Member ${userId.slice(0, 4).toUpperCase()}`;

export function BlockedUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const layout = useAdaptiveLayout();
  const users = useQuery({ queryKey: ['safety', 'blocked-users'], queryFn: getBlockedUsers });
  const unblock = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['safety'] }),
    onError: (err) => Alert.alert('Unable to unblock', err.message),
  });
  const data = users.data ?? [];

  if (users.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Safety" title="Blocked users" />
          <LoadingState variant="skeleton" count={3} />
        </View>
      </SafeAreaView>
    );
  }

  if (users.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Safety" title="Blocked users" />
          <ErrorState
            title="Unable to load blocked users"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => users.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { maxWidth: layout.maxContentWidth, padding: space.x4 }]}>
        <SectionHeader
          eyebrow="Safety"
          title="Blocked users"
          subtitle="These users cannot contact you."
        />
        {data.length === 0 ? (
          <EmptyState
            title="No blocked users"
            body="You have not blocked anyone yet."
            actionLabel="Back to Safety Center"
            onAction={() => router.push('/safety')}
          />
        ) : (
          <View style={styles.list}>
            {data.map((item) => (
              <SwipeAction
                key={item.id}
                rightAction={{
                  label: 'Unblock',
                  color: colors.success,
                  onPress: () => unblock.mutate(item.blockedUserId),
                }}
              >
                <View style={styles.card}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.blockedUserId.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.details}>
                    <Text style={styles.name}>{memberLabel(item.blockedUserId)}</Text>
                    {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}
                    <Text style={styles.meta}>
                      Blocked {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <AppIcon color={colors.muted} name="shield" size={20} />
                </View>
              </SwipeAction>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  list: { gap: space.x3 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
    padding: space.x4,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  details: { flex: 1, gap: space.x1 },
  name: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  reason: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});

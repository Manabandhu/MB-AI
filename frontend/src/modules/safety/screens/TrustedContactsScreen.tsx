import { radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrustedContacts } from '@/modules/safety/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function TrustedContactsScreen() {
  const { styles } = useScreenStyles(createScreenStyles);
  const router = useRouter();
  const layout = useAdaptiveLayout();
  const contacts = useQuery({
    queryKey: ['safety', 'trusted-contacts'],
    queryFn: getTrustedContacts,
  });
  const data = contacts.data ?? [];

  if (contacts.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Safety" title="Trusted contacts" />
          <LoadingState variant="skeleton" count={3} />
        </View>
      </SafeAreaView>
    );
  }

  if (contacts.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Safety" title="Trusted contacts" />
          <ErrorState
            title="Unable to load trusted contacts"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => contacts.refetch()}
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
          title="Trusted contacts"
          subtitle="People who can be notified during an emergency."
        />
        {data.length === 0 ? (
          <EmptyState
            title="No trusted contacts"
            body="You have not added any trusted contacts yet."
            actionLabel="Back to Safety Center"
            onAction={() => router.push('/safety')}
          />
        ) : (
          <View style={styles.list}>
            {data.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.relationship ? (
                    <Text style={styles.relationship}>{item.relationship}</Text>
                  ) : null}
                  <Text style={styles.meta}>
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    container: { alignSelf: 'center', gap: space.x6, width: '100%' },
    list: { gap: space.x3 },
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.card,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.x3,
      padding: space.x4,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: palette.primarySoft,
      borderRadius: radius.pill,
      height: 48,
      justifyContent: 'center',
      width: 48,
    },
    avatarText: { color: palette.primary, fontSize: 16, fontWeight: '800' },
    details: { flex: 1, gap: space.x1 },
    name: { color: palette.ink, fontSize: 16, fontWeight: '700', lineHeight: 22 },
    relationship: { color: palette.teal, fontSize: 14, fontWeight: '700' },
    meta: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  });
};

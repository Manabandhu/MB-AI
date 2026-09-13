import { color as colors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAssistantCitations } from '@/modules/ai-assistant/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function AssistantCitationsScreen() {
  const layout = useAdaptiveLayout();
  const router = useRouter();
  const citations = useQuery({
    queryKey: ['assistant', 'citations'],
    queryFn: getAssistantCitations,
  });
  const data = citations.data ?? [];

  if (citations.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Assistant" title="Citations" />
          <LoadingState variant="skeleton" count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (citations.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Assistant" title="Citations" />
          <ErrorState
            title="Unable to load citations"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => citations.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader
            eyebrow="Assistant"
            title="Citations"
            subtitle="Sources used for recent answers."
          />
          {data.length === 0 ? (
            <EmptyState
              title="No citations"
              body="Citations will appear here after you ask questions."
              actionLabel="Open assistant"
              onAction={() => router.push('/assistant')}
            />
          ) : (
            <View style={styles.list}>
              {data.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.iconRow}>
                    <AppIcon color={colors.primary} name="book" size={20} />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.cardBody}>{item.body ?? item.snippet ?? ''}</Text>
                  <Text style={styles.cardMeta}>{item.meta ?? item.source ?? item.url ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x6, width: '100%' },
  list: { gap: space.x3 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  cardMeta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});

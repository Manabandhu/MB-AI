import { color } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminScreenFallbacks } from '@/modules/admin/adminFallbacks';
import { listReports, resolveReport } from '@/modules/admin/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SearchBar } from '@/modules/shared/components/SearchBar';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppButton } from '@/modules/shared/ui/AppButton';

export default function AdminReportsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: listReports,
  });
  const mutation = useMutation({
    mutationFn: resolveReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  const fallback = adminScreenFallbacks.reports;
  const reports = data ?? fallback.reports ?? [];

  const filtered = useMemo(() => {
    if (!query.trim()) return reports;
    return reports.filter(
      (r) =>
        r.reporterName.toLowerCase().includes(query.toLowerCase()) ||
        r.targetId.toLowerCase().includes(query.toLowerCase()),
    );
  }, [reports, query]);

  if (isError && !reports.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load reports"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <SectionHeader title={fallback.title} subtitle={fallback.subtitle} />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search reports" />
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No reports found"
              body="Try adjusting your search."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/admin/reports/${r.id}` as Href)}
                  style={styles.item}
                >
                  <View style={styles.itemBody}>
                    <Text style={styles.itemTitle}>{r.type}</Text>
                    <Text style={styles.itemSubtitle}>Target: {r.targetId}</Text>
                    <Text style={styles.itemMeta}>
                      Reporter: {r.reporterName} · {r.status}
                    </Text>
                  </View>
                  {r.status === 'Open' ? (
                    <AppButton
                      label="Resolve"
                      variant="secondary"
                      onPress={() => mutation.mutate(r.id)}
                    />
                  ) : null}
                </Pressable>
              ))}
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
  list: { gap: 12 },
  item: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: { color: color.ink, fontSize: 17, fontWeight: '800', lineHeight: 22 },
  itemSubtitle: { color: color.muted, fontSize: 14, lineHeight: 20 },
  itemMeta: { color: color.primary, fontSize: 12, fontWeight: '700', marginTop: 4 },
});

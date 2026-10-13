import { radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReports, isOpenReport } from '@/modules/safety/api';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useAdaptiveLayout } from '@/platform/adaptive';

const statusTones: Record<string, 'success' | 'warning' | 'info'> = {
  OPEN: 'warning',
  IN_REVIEW: 'info',
  RESOLVED: 'success',
  DISMISSED: 'info',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

export function ReportsScreen() {
  const { styles } = useScreenStyles(createScreenStyles);
  const layout = useAdaptiveLayout();
  const reports = useQuery({ queryKey: ['safety', 'reports'], queryFn: getReports });
  const data = reports.data ?? [];
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter((item) => (filter === 'open' ? isOpenReport(item) : !isOpenReport(item)));
  }, [data, filter]);

  if (reports.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Safety" title="Reports" />
          <LoadingState variant="skeleton" count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (reports.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Safety" title="Reports" />
          <ErrorState
            title="Unable to load reports"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => reports.refetch()}
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
            eyebrow="Safety"
            title="Reports"
            subtitle="Track the safety reports you have submitted."
          />
          <View style={styles.filters}>
            {(['all', 'open', 'resolved'] as const).map((value) => (
              <TouchableOpacity
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === value }}
                onPress={() => setFilter(value)}
                style={[styles.filterChip, filter === value && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                  {value === 'all' ? 'All' : value === 'open' ? 'Open' : 'Closed'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.length === 0 ? (
            <EmptyState
              title="No reports"
              body="You do not have any reports matching this filter."
              actionLabel="Clear filter"
              onAction={() => setFilter('all')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.category}</Text>
                    <StatusBadge
                      label={statusLabels[item.status] ?? item.status}
                      tone={statusTones[item.status] ?? 'neutral'}
                    />
                  </View>
                  <Text style={styles.cardBody}>{item.description}</Text>
                  <Text style={styles.cardMeta}>
                    {item.severity} severity • {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    page: { flexGrow: 1, padding: space.x4 },
    container: { alignSelf: 'center', gap: space.x6, width: '100%' },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
    filterChip: {
      minHeight: 44,
      minWidth: 44,
      borderRadius: radius.pill,
      borderColor: palette.border,
      borderWidth: 1,
      paddingHorizontal: space.x4,
      paddingVertical: space.x2,
    },
    filterChipActive: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
    filterText: {
      color: palette.muted,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    filterTextActive: { color: palette.primary },
    list: { gap: space.x3 },
    card: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: radius.card,
      borderWidth: 1,
      gap: space.x2,
      padding: space.x4,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.x3,
    },
    cardTitle: { color: palette.ink, flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
    cardBody: { color: palette.muted, fontSize: 14, lineHeight: 21 },
    cardMeta: { color: palette.primary, fontSize: 12, fontWeight: '700', marginTop: space.x1 },
  });
};

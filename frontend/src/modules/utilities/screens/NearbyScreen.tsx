import { color as colors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner } from '@/modules/shared/components/Banner';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { SectionHeader } from '@/modules/shared/components/SectionHeader';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { getNearby } from '@/modules/utilities/api';
import { nearbyFallback } from '@/modules/utilities/utilitiesFallbacks';
import { useAdaptiveLayout } from '@/platform/adaptive';

export function NearbyScreen() {
  const layout = useAdaptiveLayout();
  const nearby = useQuery({ queryKey: ['utilities', 'nearby'], queryFn: getNearby });
  const data = nearby.data ?? nearbyFallback;
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(
      (item) => item.title.toLowerCase().includes(term) || item.body.toLowerCase().includes(term),
    );
  }, [data, search]);

  if (nearby.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Utilities" title="Nearby" />
          <LoadingState variant="skeleton" count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (nearby.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Utilities" title="Nearby" />
          <ErrorState
            title="Unable to load nearby places"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => nearby.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={[styles.container, { maxWidth: layout.maxContentWidth }]}>
          <SectionHeader eyebrow="Utilities" title="Nearby" subtitle="Find services around you." />
          {!permissionGranted ? (
            <Banner
              title="Location access needed"
              body="Enable location to show nearby services and distances."
              variant="warning"
            />
          ) : null}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <AppIcon color={colors.muted} name="search" size={18} />
              <Text
                style={styles.searchPlaceholder}
                onPress={() => setSearch(search === 'Search nearby...' ? '' : 'Search nearby...')}
              >
                {search || 'Search nearby...'}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Filter"
              style={styles.filterButton}
              onPress={() => setPermissionGranted((v) => !v)}
            >
              <AppIcon color={colors.primary} name="map" size={18} />
            </TouchableOpacity>
          </View>
          {filtered.length === 0 ? (
            <EmptyState
              title="No places found"
              body="Try a different search or enable location."
              actionLabel="Clear search"
              onAction={() => setSearch('')}
            />
          ) : (
            <View style={styles.list}>
              {filtered.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <AppIcon color={colors.primary} name="map" size={20} />
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.distance}>{item.distance}</Text>
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  <Text style={styles.cardMeta}>{item.meta}</Text>
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
  searchRow: { flexDirection: 'row', gap: space.x3 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    gap: space.x2,
    paddingHorizontal: space.x3,
    paddingVertical: space.x3,
  },
  searchPlaceholder: { color: colors.muted, flex: 1, fontSize: 15 },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.control,
    borderWidth: 1,
    justifyContent: 'center',
    padding: space.x3,
  },
  list: { gap: space.x3 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: space.x2,
    padding: space.x4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: space.x2 },
  cardTitle: { color: colors.ink, flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  distance: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  cardBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  cardMeta: { color: colors.muted, fontSize: 12, fontWeight: '600' },
});

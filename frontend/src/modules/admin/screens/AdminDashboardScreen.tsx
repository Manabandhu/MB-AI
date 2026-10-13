import { radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  listAdminCommunityPosts,
  listAdminEvents,
  listAdminJobs,
  listAdminRides,
  listAdminRooms,
  listReports,
  listUsers,
  resolveReport,
} from '@/modules/admin/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';

// Every count and queue item here comes from the admin APIs. There is no sample queue: an empty queue says so,
// and a failed request shows an error with retry.

const adminRoutes = [
  { label: 'Users', route: '/admin/users' },
  { label: 'Reports', route: '/admin/reports' },
  { label: 'Rooms Moderation', route: '/admin/rooms' },
  { label: 'Rides Moderation', route: '/admin/rides' },
  { label: 'Community', route: '/admin/community' },
  { label: 'Jobs', route: '/admin/jobs' },
  { label: 'Events', route: '/admin/events' },
  { label: 'Audit Log', route: '/admin/audit-log' },
  { label: 'Automations', route: '/admin/automations' },
];

const QUEUE_LIMIT = 5;

const isOpen = (status: string | null | undefined) => {
  const value = (status ?? '').toUpperCase();
  return value === 'OPEN' || value === 'IN_REVIEW' || value === 'PENDING';
};

export default function AdminDashboardScreen() {
  const { styles, palette, color } = useScreenStyles(createScreenStyles);
  const router = useRouter();
  const queryClient = useQueryClient();

  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: listUsers });
  const reportsQuery = useQuery({ queryKey: ['admin', 'reports'], queryFn: listReports });
  const roomsQuery = useQuery({ queryKey: ['admin', 'rooms'], queryFn: listAdminRooms });
  const ridesQuery = useQuery({ queryKey: ['admin', 'rides'], queryFn: listAdminRides });
  const communityQuery = useQuery({
    queryKey: ['admin', 'community'],
    queryFn: listAdminCommunityPosts,
  });
  const jobsQuery = useQuery({ queryKey: ['admin', 'jobs'], queryFn: listAdminJobs });
  const eventsQuery = useQuery({ queryKey: ['admin', 'events'], queryFn: listAdminEvents });

  const resolve = useMutation({
    mutationFn: resolveReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
    onError: (err) => Alert.alert('Unable to resolve report', err.message),
  });

  const queries = [
    usersQuery,
    reportsQuery,
    roomsQuery,
    ridesQuery,
    communityQuery,
    jobsQuery,
    eventsQuery,
  ];
  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.isError);

  const openReports = (reportsQuery.data ?? []).filter((r) => isOpen(r.status));
  const flaggedListings =
    (roomsQuery.data ?? []).filter((r) => r.reported).length +
    (ridesQuery.data ?? []).filter((r) => r.reported).length +
    (communityQuery.data ?? []).filter((p) => p.reported).length +
    (jobsQuery.data ?? []).filter((j) => j.reported).length +
    (eventsQuery.data ?? []).filter((e) => e.reported).length;
  const listingCount =
    (roomsQuery.data?.length ?? 0) +
    (ridesQuery.data?.length ?? 0) +
    (communityQuery.data?.length ?? 0) +
    (jobsQuery.data?.length ?? 0) +
    (eventsQuery.data?.length ?? 0);

  const kpis = [
    {
      value: openReports.length,
      label: 'Open Reports',
      sub: 'Awaiting moderation',
      tone: { border: '#fde68a', bg: '#fffbeb', fg: palette.goldText },
    },
    {
      value: flaggedListings,
      label: 'Flagged Listings',
      sub: 'Rooms, rides, posts, jobs, events',
      tone: { border: '#fecdd3', bg: '#fff1f2', fg: '#be123c' },
    },
    {
      value: usersQuery.data?.length ?? 0,
      label: 'Users',
      sub: 'Registered accounts',
      tone: { border: '#bbf7d0', bg: '#f0fdf4', fg: '#15803d' },
    },
    {
      value: listingCount,
      label: 'Listings',
      sub: 'Across moderated modules',
      tone: { border: palette.border, bg: '#ffffff', fg: color.primary },
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          {/* Super Admin Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
              </View>
              <Text style={styles.pageTitle}>Moderation & Trust Console</Text>
              <Text style={styles.pageSubtitle}>
                Live counts and open reports from the moderation APIs.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Open audit log"
              accessibilityRole="button"
              style={styles.auditIconBtn}
              onPress={() => router.push('/admin/audit-log')}
            >
              <AppIcon name="shield" size={20} color={color.primary} />
            </Pressable>
          </View>

          {isLoading ? (
            <LoadingState label="Loading moderation data..." />
          ) : hasError ? (
            <ErrorState
              title="Unable to load moderation data"
              body="One or more admin lists could not be loaded."
              retryLabel="Retry"
              onRetry={() => {
                for (const q of queries) if (q.isError) q.refetch();
              }}
            />
          ) : (
            <>
              {/* KPI Cards */}
              <View style={styles.kpiRow}>
                {kpis.map((kpi) => (
                  <View
                    key={kpi.label}
                    style={[
                      styles.kpiCard,
                      { borderColor: kpi.tone.border, backgroundColor: kpi.tone.bg },
                    ]}
                  >
                    <Text style={[styles.kpiValue, { color: kpi.tone.fg }]}>{kpi.value}</Text>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                    <Text style={styles.kpiSub}>{kpi.sub}</Text>
                  </View>
                ))}
              </View>

              {/* Open reports queue */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Priority Action Queue</Text>
                {openReports.length === 0 ? (
                  <Text style={styles.modMeta}>No open reports. The queue is clear.</Text>
                ) : (
                  openReports.slice(0, QUEUE_LIMIT).map((report) => (
                    <View key={report.id} style={styles.modItem}>
                      <View style={[styles.alertTag, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.alertTagText, { color: '#991b1b' }]}>
                          {report.type || 'Report'} • {report.targetType}
                        </Text>
                      </View>
                      <Text style={styles.modTitle}>{report.reason}</Text>
                      <Text style={styles.modMeta}>
                        Reporter: {report.reporterName} •{' '}
                        {new Date(report.createdAt).toLocaleDateString()} • {report.status}
                      </Text>
                      <View style={styles.modActions}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={resolve.isPending}
                          style={[styles.actionBtn, { backgroundColor: color.primary }]}
                          onPress={() => resolve.mutate(report.id)}
                        >
                          <Text style={styles.actionBtnText}>
                            {resolve.isPending && resolve.variables === report.id
                              ? 'Resolving...'
                              : 'Resolve'}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          style={styles.outlineActionBtn}
                          onPress={() => router.push('/admin/reports')}
                        >
                          <Text style={styles.outlineActionText}>Review all reports</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {/* Module Admin Links */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Administrative Modules</Text>
            <View style={styles.adminRoutesGrid}>
              {adminRoutes.map((item) => (
                <Pressable
                  accessibilityRole="link"
                  key={item.route}
                  style={styles.moduleBtn}
                  onPress={() => router.push(item.route as Href)}
                >
                  <Text style={styles.moduleBtnText}>{item.label}</Text>
                  <AppIcon name="chevron-right" size={16} color={color.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: palette.background },
    page: { flexGrow: 1, padding: space.x4 },
    container: { gap: space.x4, maxWidth: 1200, width: '100%', alignSelf: 'center' },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: palette.surface,
      padding: space.x4,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    headerLeft: { flex: 1, gap: 4 },
    adminBadge: {
      alignSelf: 'flex-start',
      backgroundColor: palette.primarySoft,
      paddingHorizontal: space.x2,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    adminBadgeText: {
      ...typography.caption,
      color: palette.primary,
      fontWeight: '800',
      fontSize: 10,
    },
    pageTitle: { ...typography.h2, color: palette.ink, fontWeight: '800' },
    pageSubtitle: { ...typography.body, color: palette.muted, fontSize: 13 },
    auditIconBtn: {
      minHeight: 44,
      minWidth: 44,
      padding: space.x2,
      borderRadius: radius.pill,
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
    },

    kpiRow: { flexDirection: 'row', gap: space.x2, flexWrap: 'wrap' },
    kpiCard: {
      flex: 1,
      minWidth: 140,
      padding: space.x3,
      borderRadius: radius.control,
      borderWidth: 1,
      gap: 2,
    },
    kpiValue: { fontSize: 24, fontWeight: '800' },
    kpiLabel: { ...typography.caption, color: palette.ink, fontWeight: '700' },
    kpiSub: { ...typography.caption, color: palette.muted, fontSize: 10 },

    sectionCard: {
      backgroundColor: palette.surface,
      padding: space.x4,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: palette.border,
      gap: space.x3,
    },
    sectionTitle: { ...typography.h3, color: palette.ink, fontWeight: '800' },

    tabsRow: { flexDirection: 'row', gap: space.x2 },
    tabPill: {
      paddingHorizontal: space.x3,
      paddingVertical: space.x2,
      borderRadius: radius.pill,
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
    },
    tabPillActive: { backgroundColor: palette.primary, borderColor: palette.primary },
    tabText: { ...typography.caption, color: palette.ink, fontWeight: '600' },
    tabTextActive: { color: '#ffffff', fontWeight: '800' },

    modItem: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: radius.control,
      padding: space.x3,
      backgroundColor: palette.surface,
      gap: space.x2,
    },
    alertTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: space.x2,
      paddingVertical: 3,
      borderRadius: 4,
    },
    alertTagText: { ...typography.caption, fontWeight: '700', fontSize: 11 },
    modTitle: { ...typography.bodyStrong, color: palette.ink, fontSize: 14 },
    modMeta: { ...typography.caption, color: palette.muted, fontSize: 12 },
    modActions: { flexDirection: 'row', gap: space.x2, flexWrap: 'wrap', marginTop: 4 },
    actionBtn: {
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: space.x3,
      paddingVertical: space.x2,
      borderRadius: radius.control,
      alignItems: 'center',
    },
    actionBtnText: { ...typography.caption, color: '#ffffff', fontWeight: '800' },
    outlineActionBtn: {
      minHeight: 44,
      minWidth: 44,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: space.x3,
      paddingVertical: space.x2,
      borderRadius: radius.control,
      alignItems: 'center',
    },
    outlineActionText: { ...typography.caption, color: palette.ink, fontWeight: '600' },

    adminRoutesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x2 },
    moduleBtn: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 180,
      flex: 1,
      paddingHorizontal: space.x3,
      paddingVertical: space.x2,
      borderRadius: radius.control,
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
    },
    moduleBtnText: { ...typography.bodyStrong, color: palette.ink, fontSize: 13 },
  });
};

import { color } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminScreenFallbacks } from '@/modules/admin/adminFallbacks';
import {
  listAdminCommunityPosts,
  listAdminEvents,
  listAdminJobs,
  listAdminRides,
  listAdminRooms,
  listAuditLog,
  listReports,
  listUsers,
} from '@/modules/admin/api';
import {
  type CatalogCard,
  CatalogScreen,
  type MetricCardData,
} from '@/modules/shared/components/CatalogScreen';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { AppButton } from '@/modules/shared/ui/AppButton';

const adminRoutes = [
  { label: 'Users', route: '/admin/users' },
  { label: 'Reports', route: '/admin/reports' },
  { label: 'Rooms', route: '/admin/rooms' },
  { label: 'Rides', route: '/admin/rides' },
  { label: 'Community', route: '/admin/community' },
  { label: 'Jobs', route: '/admin/jobs' },
  { label: 'Events', route: '/admin/events' },
  { label: 'Audit Log', route: '/admin/audit-log' },
];

export default function AdminDashboardScreen() {
  const _router = useRouter();

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
  const auditQuery = useQuery({ queryKey: ['admin', 'audit-log'], queryFn: listAuditLog });

  const fallback = adminScreenFallbacks.dashboard;
  const metrics: MetricCardData[] = fallback.metrics ?? [];

  const quickCards: CatalogCard[] = [
    {
      id: 'users',
      title: 'Users',
      body: `${usersQuery.data?.length ?? '—'} total users`,
      meta: 'Manage',
      route: '/admin/users',
    },
    {
      id: 'reports',
      title: 'Reports',
      body: `${reportsQuery.data?.length ?? '—'} open reports`,
      meta: 'Review',
      route: '/admin/reports',
    },
    {
      id: 'rooms',
      title: 'Rooms',
      body: `${roomsQuery.data?.length ?? '—'} listings`,
      meta: 'Moderate',
      route: '/admin/rooms',
    },
    {
      id: 'rides',
      title: 'Rides',
      body: `${ridesQuery.data?.length ?? '—'} rides`,
      meta: 'Moderate',
      route: '/admin/rides',
    },
    {
      id: 'community',
      title: 'Community',
      body: `${communityQuery.data?.length ?? '—'} posts`,
      meta: 'Moderate',
      route: '/admin/community',
    },
    {
      id: 'jobs',
      title: 'Jobs',
      body: `${jobsQuery.data?.length ?? '—'} jobs`,
      meta: 'Moderate',
      route: '/admin/jobs',
    },
    {
      id: 'events',
      title: 'Events',
      body: `${eventsQuery.data?.length ?? '—'} events`,
      meta: 'Moderate',
      route: '/admin/events',
    },
    {
      id: 'audit',
      title: 'Audit Log',
      body: `${auditQuery.data?.length ?? '—'} entries`,
      meta: 'View',
      route: '/admin/audit-log',
    },
  ];

  const _isLoading = usersQuery.isLoading || reportsQuery.isLoading;
  const isError = usersQuery.isError || reportsQuery.isError;

  if (isError && !quickCards.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load dashboard"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => {
            usersQuery.refetch();
            reportsQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <CatalogScreen
            eyebrow={fallback.eyebrow}
            title={fallback.title}
            subtitle={fallback.subtitle}
            metrics={metrics}
            cards={quickCards}
          />
          <View style={styles.actions}>
            {adminRoutes.map((item) => (
              <AppButton key={item.route} label={item.label} route={item.route} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: color.background },
  page: { flexGrow: 1, padding: 16 },
  container: { gap: 16, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

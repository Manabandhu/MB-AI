import { useQuery } from '@tanstack/react-query';
import { YStack } from 'tamagui';
import {
  listAdminCommunityPosts,
  listAdminEvents,
  listAdminJobs,
  listAdminRides,
  listAdminRooms,
  listReports,
  listUsers,
} from '@/modules/admin/api';
import { AdminRoleBadge } from '@/modules/admin/components/AdminBits';
import { useResolveReportAction } from '@/modules/admin/hooks';
import { useAdminAccess } from '@/modules/admin/hooks/useAdminAccess';
import { ReportCard } from '@/modules/admin/screens/AdminReportsScreen';
import { isOpenReport } from '@/modules/admin/utils/adminAccess';
import {
  type AppIconName,
  AppText,
  Card,
  Heading,
  ListRow,
  ResponsiveGrid,
  Screen,
  ScreenHeader,
  Section,
  SkeletonCard,
} from '@/modules/shared/ui';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';

// Every count and queue item here comes from the admin APIs. There is no sample queue: an empty queue says so,
// and a failed request shows an error with retry.

const adminRoutes: { label: string; route: string; icon: AppIconName; superAdmin?: boolean }[] = [
  { label: 'Users', route: '/admin/users', icon: 'user' },
  { label: 'Reports', route: '/admin/reports', icon: 'shield' },
  { label: 'Rooms moderation', route: '/admin/rooms', icon: 'bed' },
  { label: 'Rides moderation', route: '/admin/rides', icon: 'car' },
  { label: 'Community', route: '/admin/community', icon: 'community' },
  { label: 'Jobs', route: '/admin/jobs', icon: 'briefcase' },
  { label: 'Events', route: '/admin/events', icon: 'event' },
  { label: 'Audit log', route: '/admin/audit-log', icon: 'list' },
  { label: 'Automations', route: '/admin/automations', icon: 'zap', superAdmin: true },
];

const QUEUE_LIMIT = 5;

export default function AdminDashboardScreen() {
  const { role } = useAdminAccess();
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
  const { resolve, pendingId } = useResolveReportAction();

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
  const refreshing = queries.some((q) => q.isRefetching);

  const openReports = (reportsQuery.data ?? []).filter((r) => isOpenReport(r.status));
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
    { value: openReports.length, label: 'Open reports', sub: 'Open or in review' },
    { value: flaggedListings, label: 'Flagged listings', sub: 'Rooms, rides, posts, jobs, events' },
    { value: usersQuery.data?.length ?? 0, label: 'Users', sub: 'Latest 200 accounts' },
    { value: listingCount, label: 'Listings', sub: 'Latest per moderated module' },
  ];

  return (
    <Screen
      onRefresh={() => {
        for (const q of queries) void q.refetch();
      }}
      refreshing={refreshing}
    >
      <ScreenHeader
        actions={<AdminRoleBadge role={role} />}
        back={{ fallback: '/profile' }}
        subtitle="Live counts and open reports from the moderation APIs."
        title="Moderation console"
      />

      {isLoading ? (
        <YStack gap="$x2">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={3} />
        </YStack>
      ) : hasError ? (
        <ErrorState
          body="One or more admin lists could not be loaded, so the counts would be wrong."
          onRetry={() => {
            for (const q of queries) if (q.isError) void q.refetch();
          }}
          title="Unable to load moderation data"
        />
      ) : (
        <>
          <ResponsiveGrid columns={{ compact: 2, medium: 4, expanded: 4, wide: 4 }}>
            {kpis.map((kpi) => (
              <Card aria-label={`${kpi.label}: ${kpi.value}`} key={kpi.label} variant="filled">
                <Heading variant="h2">{String(kpi.value)}</Heading>
                <AppText variant="bodyStrong">{kpi.label}</AppText>
                <AppText tone="muted" variant="caption">
                  {kpi.sub}
                </AppText>
              </Card>
            ))}
          </ResponsiveGrid>

          <Section
            action={
              openReports.length > QUEUE_LIMIT
                ? { label: 'All reports', href: '/admin/reports' }
                : undefined
            }
            title="Open reports"
          >
            {openReports.length === 0 ? (
              <EmptyState
                body="No open reports. The queue is clear."
                compact
                iconName="shield"
                title="All caught up"
              />
            ) : (
              <YStack gap="$x2">
                {openReports.slice(0, QUEUE_LIMIT).map((report) => (
                  <ReportCard
                    key={report.id}
                    onResolve={(r) => void resolve(r)}
                    pendingId={pendingId}
                    report={report}
                  />
                ))}
              </YStack>
            )}
          </Section>
        </>
      )}

      <Section title="Admin areas">
        <ResponsiveGrid columns={{ compact: 1, medium: 2, expanded: 3, wide: 3 }}>
          {adminRoutes
            .filter((item) => !item.superAdmin || role === 'SUPER_ADMIN')
            .map((item) => (
              <ListRow href={item.route} icon={item.icon} key={item.route} title={item.label} />
            ))}
        </ResponsiveGrid>
      </Section>
    </Screen>
  );
}

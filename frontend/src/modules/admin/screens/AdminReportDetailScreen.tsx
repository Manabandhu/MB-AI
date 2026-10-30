import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { isOpenReport } from '@/modules/admin/adminAccess';
import { listReports } from '@/modules/admin/api';
import { ReportStatusBadge } from '@/modules/admin/components/AdminBits';
import { useResolveReportAction } from '@/modules/admin/hooks';
import { reportTypeLabel } from '@/modules/admin/screens/AdminReportsScreen';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import {
  AppButton,
  AppText,
  Card,
  Screen,
  ScreenHeader,
  Section,
  SkeletonCard,
} from '@/modules/shared/ui';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <YStack gap={2}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText selectable variant="body">
        {value}
      </AppText>
    </YStack>
  );
}

/**
 * One safety report. The backend serves reports as a list only (`GET /api/v1/admin/reports`), so this reads the
 * same cached list and picks the report by id; resolving goes through `POST /api/v1/admin/reports/{id}/resolve`.
 */
export default function AdminReportDetailScreen({ reportId }: { reportId: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: listReports,
  });
  const { resolve, pendingId } = useResolveReportAction();
  const report = data?.find((r) => r.id === reportId);
  const header = <ScreenHeader back={{ fallback: '/admin/reports' as Href }} title="Report" />;

  if (isLoading) {
    return (
      <Screen>
        {header}
        <SkeletonCard lines={4} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen>
        {header}
        <ErrorState
          body={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => void refetch()}
          title="Unable to load this report"
        />
      </Screen>
    );
  }
  if (!report) {
    return (
      <Screen>
        {header}
        <EmptyState
          body="It may have been removed, or it is older than the reports the console loads."
          iconName="shield"
          title="Report not found"
        />
      </Screen>
    );
  }

  const open = isOpenReport(report.status);
  const created = new Date(report.createdAt);
  return (
    <Screen maxWidth="form" onRefresh={() => void refetch()} refreshing={isRefetching}>
      {header}
      <Card variant="elevated">
        <YStack gap="$x2">
          <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
            <AppText variant="h4">{reportTypeLabel(report.type)}</AppText>
            <ReportStatusBadge status={report.status} />
          </XStack>
          <AppText variant="body">{report.reason?.trim() || 'No details were given.'}</AppText>
        </YStack>
      </Card>
      <Section title="Details">
        <Card>
          <YStack gap="$x3">
            <Field label="Reported by" value={report.reporterName} />
            <Field
              label="Reported on"
              value={Number.isNaN(created.getTime()) ? 'Unknown' : created.toLocaleString()}
            />
            <Field label="Reported content type" value={report.targetType} />
            <Field label="Reported content ID" value={report.targetId} />
          </YStack>
        </Card>
      </Section>
      {open ? (
        <AppButton
          fullWidth
          icon="check"
          label="Resolve report"
          loading={pendingId === report.id}
          onPress={() => void resolve(report)}
          variant="danger"
        />
      ) : (
        <AppText tone="muted" variant="caption">
          This report is closed.
        </AppText>
      )}
    </Screen>
  );
}

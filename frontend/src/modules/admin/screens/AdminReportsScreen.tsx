import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { isOpenReport } from '@/modules/admin/adminAccess';
import type { AdminReport } from '@/modules/admin/api';
import { listReports } from '@/modules/admin/api';
import { ReportStatusBadge } from '@/modules/admin/components/AdminBits';
import { useResolveReportAction } from '@/modules/admin/hooks';
import { reportCategoryLabel } from '@/modules/safety';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import {
  AppButton,
  AppText,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
  SegmentedControl,
  SkeletonCard,
  TextField,
} from '@/modules/shared/ui';

type Filter = 'open' | 'closed' | 'all';

/** Category label: `user:harassment` → "Member: Harassment or threats", "spam" → "Spam". */
export function reportTypeLabel(type: string | null | undefined) {
  const value = (type ?? '').trim();
  if (!value) return 'Report';
  const known = reportCategoryLabel(value);
  if (known !== value) return known;
  const text = value.replace(/[_:]/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function ReportCard({
  report,
  pendingId,
  onResolve,
}: {
  report: AdminReport;
  pendingId: string | undefined;
  onResolve: (report: AdminReport) => void;
}) {
  const open = isOpenReport(report.status);
  const created = new Date(report.createdAt);
  return (
    <Card padding="$x3">
      <YStack gap="$x2">
        <XStack alignItems="center" flexWrap="wrap" gap="$x2" justifyContent="space-between">
          <AppText variant="bodyStrong">{reportTypeLabel(report.type)}</AppText>
          <ReportStatusBadge status={report.status} />
        </XStack>
        <AppText numberOfLines={3} variant="body">
          {report.reason?.trim() || 'No details were given.'}
        </AppText>
        <AppText tone="muted" variant="caption">
          {report.reporterName}
          {Number.isNaN(created.getTime()) ? '' : ` · ${created.toLocaleDateString()}`}
        </AppText>
        <XStack flexWrap="wrap" gap="$x2" justifyContent="flex-end">
          <AppButton
            label="Details"
            route={`/admin/reports/${report.id}`}
            size="sm"
            variant="ghost"
          />
          {open ? (
            <AppButton
              disabled={pendingId !== undefined && pendingId !== report.id}
              label="Resolve"
              loading={pendingId === report.id}
              onPress={() => onResolve(report)}
              size="sm"
              variant="danger"
            />
          ) : null}
        </XStack>
      </YStack>
    </Card>
  );
}

/** Safety reports, open first (OPEN / IN_REVIEW, the same rule as the dashboard count), with confirmed resolve. */
export default function AdminReportsScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: listReports,
  });
  const { resolve, pendingId } = useResolveReportAction();

  const reports = data ?? [];
  const openCount = reports.filter((r) => isOpenReport(r.status)).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      const open = isOpenReport(r.status);
      if (filter === 'open' && !open) return false;
      if (filter === 'closed' && open) return false;
      if (!q) return true;
      return [r.type, r.reason, r.reporterName].some((v) => (v ?? '').toLowerCase().includes(q));
    });
  }, [data, filter, query]);

  return (
    <Screen onRefresh={() => void refetch()} refreshing={isRefetching}>
      <ScreenHeader
        back={{ fallback: '/admin' as Href }}
        subtitle="Review what members reported and resolve it."
        title="Reports"
      />
      <SegmentedControl
        label="Report status"
        onChange={setFilter}
        options={[
          { value: 'open', label: 'Open', count: data ? openCount : undefined },
          { value: 'closed', label: 'Closed' },
          { value: 'all', label: 'All' },
        ]}
        value={filter}
      />
      <TextField
        autoCorrect={false}
        leadingIcon="search"
        onChangeText={setQuery}
        placeholder="Search by category, details, or reporter"
        trailing={
          query ? (
            <IconButton
              icon="close"
              label="Clear search"
              onPress={() => setQuery('')}
              variant="plain"
            />
          ) : undefined
        }
        value={query}
      />
      {isLoading ? (
        <YStack gap="$x2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </YStack>
      ) : isError ? (
        <ErrorState
          body={error instanceof Error ? error.message : 'Please try again.'}
          onRetry={() => void refetch()}
          title="Unable to load reports"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          actionLabel={query ? 'Clear search' : undefined}
          body={
            query
              ? 'No report matches that search.'
              : filter === 'open'
                ? 'The queue is clear.'
                : 'Nothing to show here.'
          }
          iconName="shield"
          onAction={query ? () => setQuery('') : undefined}
          title={filter === 'open' && !query ? 'No open reports' : 'No reports found'}
        />
      ) : (
        <YStack gap="$x2">
          {filtered.map((r) => (
            <ReportCard
              key={r.id}
              onResolve={(report) => void resolve(report)}
              pendingId={pendingId}
              report={r}
            />
          ))}
        </YStack>
      )}
    </Screen>
  );
}

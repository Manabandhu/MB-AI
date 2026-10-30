import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { type ChatContact, useChatContacts } from '@/modules/chat';
import { getReports, isOpenReport } from '@/modules/safety/api';
import { ReportSheet } from '@/modules/safety/components/ReportSheet';
import { reportCategoryLabel, reportStatus } from '@/modules/safety/safetyFormat';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { PersonRow } from '@/modules/shared/ui/PersonRow';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

type Filter = 'all' | 'open' | 'closed';

/** A little longer than `BottomSheet`'s 220 ms slide-out, after which its modal unmounts. */
const SHEET_CLOSE_MS = 280;

/** Picks who to report from the people you chat with; reports need a real member id. */
function PickPersonSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (contact: ChatContact) => void;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const contacts = useChatContacts(currentUserId, visible);
  return (
    <BottomSheet
      onClose={onClose}
      scrollable
      subtitle="Choose a member you have chatted with. To report a listing, ride or post, use Report on that page."
      title="Who are you reporting?"
      visible={visible}
    >
      {contacts.isLoading ? (
        <LoadingState label="Loading people you chat with…" />
      ) : contacts.isError ? (
        <ErrorState
          body="Check your connection and try again."
          compact
          onRetry={() => contacts.refetch()}
          retryLabel="Retry"
          title="Unable to load your contacts"
        />
      ) : (contacts.data ?? []).length === 0 ? (
        <EmptyState
          body="You have no chats yet. You can report a member from a conversation's details."
          compact
          iconName="message"
          title="No one to pick"
        />
      ) : (
        <YStack gap="$x2">
          {(contacts.data ?? []).map((c) => (
            <PersonRow
              actions={
                <AppButton label="Report" onPress={() => onPick(c)} size="sm" variant="secondary" />
              }
              key={c.userId}
              name={c.label}
              subtitle={`In ${c.sharedIn.map((s) => s.title).join(', ')}`}
            />
          ))}
        </YStack>
      )}
    </BottomSheet>
  );
}

/** The reports you filed, with their status, and an entry to file a new one about someone you chat with. */
export function ReportsScreen() {
  const reports = useQuery({ queryKey: ['safety', 'reports'], queryFn: getReports });
  const [filter, setFilter] = useState<Filter>('all');
  const [picking, setPicking] = useState(false);
  const [target, setTarget] = useState<ChatContact | null>(null);
  const data = reports.data ?? [];

  const counts = useMemo(
    () => ({
      all: data.length,
      open: data.filter(isOpenReport).length,
      closed: data.filter((r) => !isOpenReport(r)).length,
    }),
    [data],
  );
  const filtered = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter((item) => (filter === 'open' ? isOpenReport(item) : !isOpenReport(item)));
  }, [data, filter]);

  const body = () => {
    if (reports.isLoading) return <LoadingState count={4} variant="skeleton" />;
    if (reports.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => reports.refetch()}
          retryLabel="Retry"
          title="Unable to load reports"
        />
      );
    }
    if (data.length === 0) {
      return (
        <EmptyState
          actionLabel="File a report"
          body="Reports you file about members or conversations appear here with their status."
          iconName="shield"
          onAction={() => setPicking(true)}
          title="No reports yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        <SegmentedControl
          label="Filter reports"
          onChange={(v) => setFilter(v as Filter)}
          options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'open', label: 'Open', count: counts.open },
            { value: 'closed', label: 'Closed', count: counts.closed },
          ]}
          value={filter}
        />
        {filtered.length === 0 ? (
          <EmptyState
            actionLabel="Show all"
            body="No reports match this filter."
            compact
            onAction={() => setFilter('all')}
            title="No reports"
          />
        ) : (
          filtered.map((item) => {
            const status = reportStatus(item.status);
            return (
              <Card key={item.id}>
                <StatusBadge label={status.label} tone={status.tone} />
                <AppText variant="bodyStrong">{reportCategoryLabel(item.category)}</AppText>
                <AppText tone="muted" variant="body">
                  {item.description}
                </AppText>
                <AppText tone="muted" variant="caption">
                  {String(item.severity).charAt(0) + String(item.severity).slice(1).toLowerCase()}{' '}
                  severity · filed {formatDate(item.createdAt, 'short')}
                </AppText>
              </Card>
            );
          })
        )}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => reports.refetch()} refreshing={reports.isRefetching}>
      <ScreenHeader
        back={{ fallback: '/safety' as Href }}
        primaryAction={{ label: 'File a report', icon: 'plus', onPress: () => setPicking(true) }}
        subtitle="Track the safety reports you have filed."
        title="Reports"
      />
      {body()}
      <PickPersonSheet
        onClose={() => setPicking(false)}
        onPick={(contact) => {
          setPicking(false);
          // Two modals cannot be up at once on iOS: open the report sheet after the picker's close animation.
          setTimeout(() => setTarget(contact), SHEET_CLOSE_MS);
        }}
        visible={picking}
      />
      <ReportSheet
        onClose={() => setTarget(null)}
        targetId={target?.userId ?? null}
        targetLabel={target?.label ?? ''}
        targetType="user"
        visible={target !== null}
      />
    </Screen>
  );
}

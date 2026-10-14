import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  archiveRoomListing,
  deleteRoomListing,
  getMyListings,
  markRoomRented,
  pauseRoomListing,
  publishRoomListing,
} from '@/modules/rooms/api';
import { roomSaveNoticeText } from '@/modules/rooms/saveNotice';
import { type OwnerRoomListing, statusIs } from '@/modules/rooms/types';
import { showError } from '@/modules/rooms/utils/notify';
import { formatRent } from '@/modules/rooms/utils/roomFormat';
import {
  ARCHIVE_CONFIRM,
  errorMessage,
  statusLabel,
  statusTone,
} from '@/modules/rooms/utils/roomLabels';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { OwnerItemCard, type OwnerItemOverflowAction } from '@/modules/shared/ui/OwnerItemCard';
import { ResponsiveGrid } from '@/modules/shared/ui/ResponsiveGrid';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

type ListingTab = 'active' | 'drafts' | 'rented';
type StatusAction = 'publish' | 'pause' | 'rented' | 'archive';

const TAB_STATUSES = {
  active: ['active', 'paused'],
  drafts: ['draft', 'rejected'],
  rented: ['rented', 'archived'],
} as const;

const EMPTY_COPY: Record<ListingTab, { title: string; body: string }> = {
  active: {
    title: 'No live listings',
    body: 'Published and paused listings appear here. Post a room or publish a draft.',
  },
  drafts: {
    title: 'No drafts',
    body: 'Listings you saved without publishing (and any a moderator sent back) appear here.',
  },
  rented: {
    title: 'Nothing rented yet',
    body: 'Listings you mark as rented or archive appear here for your records.',
  },
};

const ACTION_COPY: Record<StatusAction, string> = {
  publish: 'Could not publish listing',
  pause: 'Could not pause listing',
  rented: 'Could not mark listing as rented',
  archive: 'Could not archive listing',
};

/** The owner's listings with publish/pause/rented/relist/archive/delete actions. */
export function RoomMyListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const params = useLocalSearchParams<{ notice?: string }>();
  const notice = roomSaveNoticeText(params.notice);
  const confirm = useConfirm();
  const [tab, setTab] = useState<ListingTab>('active');

  const listingsQuery = useQuery({
    queryKey: ['rooms', 'my-listings'],
    queryFn: getMyListings,
    enabled: isAuthenticated,
  });

  const invalidate = () =>
    Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
      queryClient.invalidateQueries({ queryKey: ['rooms', 'listings'] }),
      queryClient.invalidateQueries({ queryKey: ['rooms', 'detail'] }),
      queryClient.invalidateQueries({ queryKey: ['rooms', 'owner'] }),
    ]);

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: StatusAction }) => {
      switch (action) {
        case 'publish':
          return publishRoomListing(id);
        case 'pause':
          return pauseRoomListing(id);
        case 'rented':
          return markRoomRented(id);
        case 'archive':
          return archiveRoomListing(id);
      }
    },
    onError: (error, { action }) => showError(ACTION_COPY[action], error),
    onSettled: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoomListing(id),
    onError: (error) => showError('Could not delete listing', error),
    onSettled: invalidate,
  });

  const listings = listingsQuery.data ?? [];
  const grouped = useMemo(() => {
    const byTab = (t: ListingTab) => listings.filter((l) => statusIs(l.status, ...TAB_STATUSES[t]));
    return { active: byTab('active'), drafts: byTab('drafts'), rented: byTab('rented') };
  }, [listings]);

  const busyId =
    statusMutation.isPending || deleteMutation.isPending
      ? (statusMutation.variables?.id ?? deleteMutation.variables)
      : undefined;

  const onArchive = async (listing: OwnerRoomListing) => {
    if (await confirm(ARCHIVE_CONFIRM))
      statusMutation.mutate({ id: listing.id, action: 'archive' });
  };

  const onDelete = async (listing: OwnerRoomListing) => {
    const confirmed = await confirm({
      title: 'Delete listing?',
      body: `"${listing.title}" and its inquiries will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) deleteMutation.mutate(listing.id);
  };

  const body = () => {
    if (!isAuthenticated || listingsQuery.isLoading) {
      return <LoadingState count={3} label="Loading your listings…" variant="skeleton" />;
    }
    if (listingsQuery.isError) {
      return (
        <ErrorState
          body={errorMessage(listingsQuery.error)}
          onRetry={() => listingsQuery.refetch()}
          retryLabel="Retry"
          title="Could not load your listings"
        />
      );
    }
    const items = grouped[tab];
    if (items.length === 0) {
      return (
        <EmptyState
          actionLabel="Post a room"
          body={EMPTY_COPY[tab].body}
          iconName="home"
          onAction={() => router.push('/rooms/create-listing' as Href)}
          title={EMPTY_COPY[tab].title}
        />
      );
    }
    return (
      <ResponsiveGrid columns={{ compact: 1, medium: 1, expanded: 2, wide: 2 }} gap={12}>
        {items.map((listing) => (
          <ListingCard
            busy={busyId === listing.id}
            key={listing.id}
            listing={listing}
            onAction={(action) => statusMutation.mutate({ id: listing.id, action })}
            onArchive={() => onArchive(listing)}
            onDelete={() => onDelete(listing)}
          />
        ))}
      </ResponsiveGrid>
    );
  };

  return (
    <Screen onRefresh={() => listingsQuery.refetch()} refreshing={listingsQuery.isRefetching}>
      <YStack gap="$x4">
        <ScreenHeader
          back={{ fallback: '/rooms' as Href }}
          primaryAction={{
            icon: 'plus',
            label: 'Post a room',
            route: '/rooms/create-listing' as Href,
          }}
          subtitle="Publish, pause, and manage the rooms you posted"
          title="My listings"
        />
        {notice ? (
          <Card aria-live="polite" variant="tinted">
            <AppText variant="label">{notice}</AppText>
          </Card>
        ) : null}
        <SegmentedControl
          label="Listing status"
          onChange={setTab}
          options={[
            { value: 'active', label: `Active (${grouped.active.length})` },
            { value: 'drafts', label: `Drafts (${grouped.drafts.length})` },
            { value: 'rented', label: `Rented (${grouped.rented.length})` },
          ]}
          value={tab}
        />
        {body()}
      </YStack>
    </Screen>
  );
}

function ListingCard({
  listing,
  busy,
  onAction,
  onArchive,
  onDelete,
}: {
  listing: OwnerRoomListing;
  busy: boolean;
  onAction: (action: StatusAction) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const status = listing.status;
  const isActive = statusIs(status, 'active');
  const isPaused = statusIs(status, 'paused');
  const isDraft = statusIs(status, 'draft');
  const isRejected = statusIs(status, 'rejected');
  const isRented = statusIs(status, 'rented');
  const edit = () => router.push(`/rooms/${listing.id}/edit` as Href);

  // One status action inline next to Edit; the rest live in the "More" sheet.
  const primary: { label: string; action: StatusAction } | null = isActive
    ? { label: 'Pause', action: 'pause' }
    : isPaused || isDraft
      ? { label: 'Publish', action: 'publish' }
      : isRented
        ? { label: 'Relist', action: 'publish' }
        : null;
  const overflow: OwnerItemOverflowAction[] = [];
  if (isActive || isPaused) {
    overflow.push({ label: 'Mark rented', icon: 'check', onPress: () => onAction('rented') });
  }
  if (isRented || isActive || isPaused || isDraft) {
    overflow.push({ label: 'Archive', icon: 'package', onPress: onArchive, destructive: true });
  }
  overflow.push({ label: 'Delete listing', icon: 'close', onPress: onDelete, destructive: true });

  return (
    <OwnerItemCard
      actions={
        <>
          <AppButton disabled={busy} label="Edit" onPress={edit} size="sm" variant="secondary" />
          {primary ? (
            <AppButton
              label={primary.label}
              loading={busy}
              onPress={() => onAction(primary.action)}
              size="sm"
            />
          ) : null}
        </>
      }
      href={`/rooms/${listing.id}` as Href}
      imageUrl={listing.coverImageUrl}
      meta={[listing.roomType, listing.broadLocation ?? '']}
      note={
        isActive
          ? 'Visible in search'
          : isPaused
            ? 'Paused: hidden from search'
            : isDraft
              ? 'Draft: only you can see it'
              : isRejected
                ? 'Sent back by a moderator. Edit it; a moderator must approve it again.'
                : isRented
                  ? 'Rented: hidden from search'
                  : 'Archived'
      }
      overflow={busy ? undefined : overflow}
      status={<StatusBadge label={statusLabel(status)} tone={statusTone(status)} />}
      title={listing.title}
      trailing={formatRent(listing.price)}
    />
  );
}

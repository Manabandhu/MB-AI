import { formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  archiveRoomListing,
  deleteRoomListing,
  getMyListings,
  markRoomRented,
  pauseRoomListing,
  publishRoomListing,
} from '@/modules/rooms/api';
import { type OwnerRoomListing, statusIs } from '@/modules/rooms/types';
import { confirmAction, showError } from '@/modules/rooms/utils/notify';
import { errorMessage, statusLabel } from '@/modules/rooms/utils/roomLabels';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';

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

  const onDelete = async (listing: OwnerRoomListing) => {
    const confirmed = await confirmAction(
      'Delete listing?',
      `"${listing.title}" and its inquiries will be permanently removed.`,
      'Delete',
    );
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
      <YStack gap="$x3">
        {items.map((listing) => (
          <ListingCard
            busy={busyId === listing.id}
            key={listing.id}
            listing={listing}
            onAction={(action) => statusMutation.mutate({ id: listing.id, action })}
            onDelete={() => onDelete(listing)}
            onEdit={() => router.push(`/rooms/${listing.id}/edit` as Href)}
            onView={() => router.push(`/rooms/${listing.id}` as Href)}
          />
        ))}
      </YStack>
    );
  };

  return (
    <Screen onRefresh={() => listingsQuery.refetch()} refreshing={listingsQuery.isRefetching}>
      <YStack gap="$x4">
        <BackButton fallback="/rooms" />
        <XStack alignItems="center" flexWrap="wrap" gap="$x3" justifyContent="space-between">
          <YStack flex={1} gap={2} minWidth={200}>
            <AppText role="heading" variant="h2">
              My listings
            </AppText>
            <AppText tone="muted" variant="caption">
              Publish, pause, and manage the rooms you posted
            </AppText>
          </YStack>
          <AppButton
            icon="plus"
            label="Post a room"
            onPress={() => router.push('/rooms/create-listing' as Href)}
            size="sm"
          />
        </XStack>
        {typeof params.notice === 'string' && params.notice ? (
          <Card aria-live="polite" variant="tinted">
            <AppText variant="label">{params.notice}</AppText>
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
  onDelete,
  onEdit,
  onView,
}: {
  listing: OwnerRoomListing;
  busy: boolean;
  onAction: (action: StatusAction) => void;
  onDelete: () => void;
  onEdit: () => void;
  onView: () => void;
}) {
  const status = listing.status;
  const isActive = statusIs(status, 'active');
  const isPaused = statusIs(status, 'paused');
  const isDraft = statusIs(status, 'draft');
  const isRejected = statusIs(status, 'rejected');
  const isRented = statusIs(status, 'rented');

  return (
    <Card gap="$x3" variant="outlined">
      <XStack alignItems="center" gap="$x2" justifyContent="space-between">
        <Chip label={statusLabel(status)} selected={isActive} />
        <AppText tone="primary" variant="bodyStrong">
          {formatMoney(listing.price, 'USD')}/mo
        </AppText>
      </XStack>
      <YStack gap={2}>
        <AppText numberOfLines={2} variant="bodyStrong">
          {listing.title}
        </AppText>
        {listing.broadLocation ? (
          <AppText numberOfLines={1} tone="muted" variant="caption">
            {listing.broadLocation}
          </AppText>
        ) : null}
        <AppText tone="muted" variant="caption">
          {isActive
            ? 'Visible in search'
            : isPaused
              ? 'Paused: hidden from search'
              : isDraft
                ? 'Draft: only you can see it'
                : isRejected
                  ? 'Sent back by a moderator. Edit it; a moderator must approve it again.'
                  : isRented
                    ? 'Rented: hidden from search'
                    : 'Archived'}
        </AppText>
      </YStack>
      <XStack flexWrap="wrap" gap="$x2">
        {isActive ? (
          <AppButton
            label="Pause"
            loading={busy}
            onPress={() => onAction('pause')}
            size="sm"
            variant="secondary"
          />
        ) : null}
        {isPaused || isDraft ? (
          <AppButton label="Publish" loading={busy} onPress={() => onAction('publish')} size="sm" />
        ) : null}
        {isActive || isPaused ? (
          <AppButton
            disabled={busy}
            label="Mark rented"
            onPress={() => onAction('rented')}
            size="sm"
            variant="secondary"
          />
        ) : null}
        {isRented ? (
          <>
            <AppButton
              label="Relist"
              loading={busy}
              onPress={() => onAction('publish')}
              size="sm"
            />
            <AppButton
              disabled={busy}
              label="Archive"
              onPress={() => onAction('archive')}
              size="sm"
              variant="secondary"
            />
          </>
        ) : null}
        <AppButton disabled={busy} label="Edit" onPress={onEdit} size="sm" variant="secondary" />
        <AppButton label="View" onPress={onView} size="sm" variant="ghost" />
        <AppButton disabled={busy} label="Delete" onPress={onDelete} size="sm" variant="danger" />
      </XStack>
    </Card>
  );
}

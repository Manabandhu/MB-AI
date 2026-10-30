import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { confirmAction, showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { deleteListing, getMyListings, updateListing } from '../api';
import { ListingStatusBadge, PhotoPlaceholder } from '../components/ListingBits';
import type { ListingStatus, MarketplaceListing } from '../types';
import { formatListedDate, formatListingPrice } from '../utils/format';
import { errorMessage, ownerStatusActions, statusIs } from '../utils/listingRules';

type Tab = 'selling' | 'sold' | 'all';

const TAB_FILTER: Record<Tab, (l: MarketplaceListing) => boolean> = {
  selling: (l) => statusIs(l.status, 'active', 'reserved'),
  sold: (l) => statusIs(l.status, 'sold', 'removed'),
  all: () => true,
};

const EMPTY_COPY: Record<Tab, { title: string; body: string }> = {
  selling: {
    title: 'Nothing for sale',
    body: 'Items you list (and ones you mark reserved) appear here.',
  },
  sold: {
    title: 'Nothing sold yet',
    body: 'Items you mark as sold appear here. You can relist them any time.',
  },
  all: { title: 'No listings yet', body: 'List something you no longer need. It takes a minute.' },
};

const THUMB = 72;

/** `/marketplace/mine`: the seller's listings in every status, with quick status, edit and delete actions. */
export function MyListingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const [tab, setTab] = useState<Tab>('selling');
  const [pulling, setPulling] = useState(false);

  const mineQuery = useQuery({
    queryKey: ['marketplace', 'mine'],
    queryFn: getMyListings,
    enabled: signedIn,
  });

  const invalidate = (id: string) =>
    Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', id] }),
      // Saved lists show other members' copies of this listing (and its status), so refresh them too.
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'saved'] }),
    ]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ListingStatus }) =>
      updateListing(id, { status }),
    onError: (error) => showError('Could not update the listing', error),
    onSettled: (_data, _error, vars) => invalidate(vars.id),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onError: (error) => showError('Could not delete the listing', error),
    onSettled: (_data, _error, id) => invalidate(id),
  });

  const handleDelete = async (listing: MarketplaceListing) => {
    const ok = await confirmAction(
      `Delete "${listing.title}"?`,
      'The listing and its photos are deleted for good.',
      'Delete',
      { destructive: true },
    );
    if (ok) deleteMutation.mutate(listing.id);
  };

  // Marking sold hides the listing from buyers, so ask first; other status changes are one tap and reversible.
  const changeStatus = async (listing: MarketplaceListing, status: ListingStatus) => {
    if (status === 'sold') {
      const ok = await confirmAction(
        `Mark "${listing.title}" as sold?`,
        'Buyers will no longer see it in the marketplace. You can relist it any time.',
        'Mark sold',
      );
      if (!ok) return;
    }
    statusMutation.mutate({ id: listing.id, status });
  };

  const refresh = async () => {
    setPulling(true);
    try {
      await mineQuery.refetch();
    } finally {
      setPulling(false);
    }
  };

  const all = mineQuery.data ?? [];
  const visible = all.filter(TAB_FILTER[tab]);
  const counts = {
    selling: all.filter(TAB_FILTER.selling).length,
    sold: all.filter(TAB_FILTER.sold).length,
    all: all.length,
  };

  return (
    <Screen onRefresh={refresh} refreshing={pulling}>
      <YStack gap="$x4">
        <XStack alignItems="center" gap="$x2">
          <BackButton fallback="/marketplace" />
          <AppText flex={1} role="heading" variant="h2">
            My listings
          </AppText>
          <AppButton
            icon="plus"
            label="Sell"
            onPress={() => router.push('/marketplace/sell' as Href)}
          />
        </XStack>

        <SegmentedControl
          label="Listing status"
          onChange={setTab}
          options={[
            {
              value: 'selling',
              label: mineQuery.isSuccess ? `For sale (${counts.selling})` : 'For sale',
            },
            { value: 'sold', label: mineQuery.isSuccess ? `Sold (${counts.sold})` : 'Sold' },
            { value: 'all', label: mineQuery.isSuccess ? `All (${counts.all})` : 'All' },
          ]}
          value={tab}
        />

        {!signedIn || mineQuery.isLoading ? (
          <LoadingState count={3} label="Loading your listings…" variant="skeleton" />
        ) : mineQuery.isError ? (
          <ErrorState
            body={errorMessage(mineQuery.error)}
            onRetry={() => mineQuery.refetch()}
            retryLabel="Retry"
            title="Could not load your listings"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            actionLabel="Sell an item"
            body={EMPTY_COPY[tab].body}
            iconName="package"
            onAction={() => router.push('/marketplace/sell' as Href)}
            title={EMPTY_COPY[tab].title}
          />
        ) : (
          <YStack gap="$x3">
            {visible.map((listing) => {
              const pendingStatus =
                statusMutation.isPending && statusMutation.variables?.id === listing.id
                  ? statusMutation.variables.status
                  : undefined;
              const deleting = deleteMutation.isPending && deleteMutation.variables === listing.id;
              const busy = Boolean(pendingStatus) || deleting;
              const removed = statusIs(listing.status, 'removed');
              return (
                <Card gap="$x3" key={listing.id} variant="outlined">
                  <XStack
                    aria-label={`Open ${listing.title}`}
                    borderRadius="$control"
                    cursor="pointer"
                    focusVisibleStyle={{
                      outlineWidth: 3,
                      outlineStyle: 'solid',
                      outlineColor: '$outlineColor',
                    }}
                    focusable
                    gap="$x3"
                    onPress={() => router.push(`/marketplace/${listing.id}` as Href)}
                    {...keyboardPress(
                      () => router.push(`/marketplace/${listing.id}` as Href),
                      true,
                      'link',
                    )}
                    role="link"
                  >
                    <YStack borderRadius="$control" height={THUMB} overflow="hidden" width={THUMB}>
                      {listing.coverImageUrl ? (
                        <Image
                          source={{ uri: listing.coverImageUrl }}
                          style={{ width: THUMB, height: THUMB }}
                        />
                      ) : (
                        <PhotoPlaceholder height={THUMB} />
                      )}
                    </YStack>
                    <YStack flex={1} gap={2}>
                      <AppText numberOfLines={2} variant="bodyStrong">
                        {listing.title}
                      </AppText>
                      <AppText tone="primary" variant="label">
                        {formatListingPrice(listing.price, listing.currency)}
                      </AppText>
                      <XStack alignItems="center" flexWrap="wrap" gap="$x2">
                        <ListingStatusBadge showActive status={listing.status} />
                        {formatListedDate(listing.createdAt) ? (
                          <AppText tone="muted" variant="caption">
                            Listed {formatListedDate(listing.createdAt)}
                          </AppText>
                        ) : null}
                      </XStack>
                    </YStack>
                  </XStack>
                  <XStack flexWrap="wrap" gap="$x2">
                    {ownerStatusActions(listing.status).map((action) => (
                      <AppButton
                        disabled={busy && pendingStatus !== action.status}
                        key={action.status}
                        label={action.label}
                        loading={pendingStatus === action.status}
                        onPress={() => void changeStatus(listing, action.status)}
                        variant="secondary"
                      />
                    ))}
                    {!removed ? (
                      <AppButton
                        disabled={busy}
                        label="Edit"
                        onPress={() => router.push(`/marketplace/${listing.id}/edit` as Href)}
                        variant="secondary"
                      />
                    ) : null}
                    <AppButton
                      disabled={busy && !deleting}
                      label="Delete"
                      loading={deleting}
                      onPress={() => handleDelete(listing)}
                      variant="ghost"
                    />
                  </XStack>
                  {removed ? (
                    <AppText tone="danger" variant="caption">
                      A moderator removed this listing; buyers cannot see it.
                    </AppText>
                  ) : null}
                </Card>
              );
            })}
          </YStack>
        )}
      </YStack>
    </Screen>
  );
}

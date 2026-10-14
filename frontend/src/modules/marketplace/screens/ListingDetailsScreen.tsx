import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, ScrollView } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';
import {
  contactSeller,
  deleteListing,
  getMarketplaceListing,
  getMarketplaceListingImages,
  updateListing,
} from '../api';
import { ListingStatusBadge, PhotoPlaceholder, SaveToggle } from '../components/ListingBits';
import { ReportListingSheet } from '../components/ReportListingSheet';
import { useListingSave } from '../hooks/useListingSave';
import type { ListingStatus, MarketplaceListing } from '../types';
import { formatListedDate, formatListingPrice } from '../utils/format';
import {
  errorMessage,
  isNotFound,
  ownerStatusActions,
  shareMessage,
  statusIs,
} from '../utils/listingRules';
import { confirmAction, showError, showMessage } from '../utils/notify';

const GALLERY_HEIGHT = 300;
/** The owner's bar can wrap to two rows, so reserve a little more than one bar. */
const BOTTOM_BAR_SPACE = ACTION_BAR_SPACE + 14;

/** Public listing detail. Owners get status, edit and delete actions; everyone else can save, chat, or report. */
export function ListingDetailsScreen() {
  const { listingId: rawId } = useLocalSearchParams<{ listingId: string }>();
  const listingId = typeof rawId === 'string' ? rawId : '';
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const { isSaved, toggle } = useListingSave();
  const [contacting, setContacting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const listingQuery = useQuery({
    queryKey: ['marketplace', 'listing', listingId],
    queryFn: () => getMarketplaceListing(listingId),
    enabled: Boolean(listingId),
    retry: (count, error) => !isNotFound(error) && count < 2,
  });
  const listing = listingQuery.data;

  const imagesQuery = useQuery({
    queryKey: ['marketplace', 'images', listingId],
    queryFn: () => getMarketplaceListingImages(listingId),
    enabled: Boolean(listing),
  });

  const invalidateAll = () =>
    Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', listingId] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'saved'] }),
    ]);

  const statusMutation = useMutation({
    mutationFn: (status: ListingStatus) => updateListing(listingId, { status }),
    onSuccess: (updated) =>
      queryClient.setQueryData(['marketplace', 'listing', listingId], updated),
    onError: (error) => showError('Could not update the listing', error),
    onSettled: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteListing(listingId),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['marketplace', 'listing', listingId] });
      await invalidateAll();
      router.replace('/marketplace/mine' as Href);
    },
    onError: (error) => showError('Could not delete the listing', error),
  });

  if (!listingId || listingQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/marketplace" />
        {listingId ? (
          <LoadingState label="Loading listing…" />
        ) : (
          <ErrorState
            body="This link does not point to a listing."
            onRetry={() => router.replace('/marketplace' as Href)}
            retryLabel="Browse marketplace"
            title="Listing not found"
          />
        )}
      </Screen>
    );
  }

  if (listingQuery.isError || !listing) {
    const notFound = isNotFound(listingQuery.error);
    return (
      <Screen>
        <BackButton fallback="/marketplace" />
        <ErrorState
          body={
            notFound
              ? 'This listing was deleted or removed and is no longer available.'
              : errorMessage(listingQuery.error)
          }
          onRetry={
            notFound ? () => router.replace('/marketplace' as Href) : () => listingQuery.refetch()
          }
          retryLabel={notFound ? 'Browse marketplace' : 'Retry'}
          title={notFound ? 'Listing not found' : 'Could not load this listing'}
        />
      </Screen>
    );
  }

  const price = formatListingPrice(listing.price, listing.currency);
  const photoUrls = imagesQuery.data?.length
    ? imagesQuery.data.map((img) => img.url)
    : listing.coverImageUrl
      ? [listing.coverImageUrl]
      : [];
  const listed = formatListedDate(listing.createdAt);

  const handleShare = async () => {
    try {
      // Web URL when configured (opens the app if installed), not a bare app-scheme link that fails in browsers.
      const result = await shareLink(
        `/marketplace/${listing.id}`,
        shareMessage({ title: listing.title, priceLabel: price, location: listing.location }),
      );
      if (result === 'copied')
        showMessage('Link copied', 'Paste it anywhere to share this listing.');
    } catch (error) {
      showError('Could not share this listing', error);
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    setContacting(true);
    try {
      const res = await contactSeller(listing.id);
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      router.push(`/chat/${res.conversationId}` as Href);
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      showError(
        'Could not contact the seller',
        status === 409 ? new Error('This item is no longer available for new chats.') : error,
      );
    } finally {
      setContacting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirmAction(
      'Delete this listing?',
      'The listing and its photos are deleted for good. Buyers who saved it will no longer see it.',
      'Delete',
      { destructive: true },
    );
    if (ok) deleteMutation.mutate();
  };

  return (
    <YStack backgroundColor="$background" flex={1}>
      <Screen bottomInset={BOTTOM_BAR_SPACE}>
        <YStack gap="$x4">
          <XStack alignItems="center" justifyContent="space-between">
            <BackButton fallback="/marketplace" />
            <XStack gap="$x2">
              {!listing.isMine ? (
                <SaveToggle
                  onPress={() => toggle(listing)}
                  saved={isSaved(listing)}
                  title={listing.title}
                />
              ) : null}
              <IconButton icon="share" label="Share listing" onPress={handleShare} />
            </XStack>
          </XStack>

          <Gallery
            imagesError={imagesQuery.isError}
            onRetryImages={() => imagesQuery.refetch()}
            urls={photoUrls}
          />

          <YStack gap="$x2">
            <XStack alignItems="center" flexWrap="wrap" gap="$x2">
              {listing.category ? <Chip label={listing.category.name} /> : null}
              {listing.isMine ? <Chip label="Your listing" selected /> : null}
              <ListingStatusBadge status={listing.status} />
            </XStack>
            <AppText role="heading" variant="h2">
              {listing.title}
            </AppText>
            <AppText tone="primary" variant="h3">
              {price}
              {listing.negotiable && Number(listing.price) > 0 ? (
                <AppText tone="muted" variant="caption">
                  {'  '}Negotiable
                </AppText>
              ) : null}
            </AppText>
            {listing.location ? (
              <XStack alignItems="center" gap="$x1">
                <AppIcon name="map-pin" size={16} />
                <AppText tone="muted">{listing.location}</AppText>
              </XStack>
            ) : null}
          </YStack>

          <Card gap="$x2" variant="outlined">
            <AppText role="heading" variant="h4">
              Details
            </AppText>
            <Fact label="Condition" value={listing.condition} />
            <Fact label="Category" value={listing.category?.name ?? null} />
            <Fact
              label="Price"
              value={
                Number(listing.price) === 0 ? 'Free' : listing.negotiable ? 'Negotiable' : 'Firm'
              }
            />
            <Fact label="Listed" value={listed} />
          </Card>

          {listing.description ? (
            <Card gap="$x2" variant="outlined">
              <AppText role="heading" variant="h4">
                Description
              </AppText>
              <AppText>{listing.description}</AppText>
            </Card>
          ) : null}

          {!listing.isMine ? (
            <Card gap="$x1" variant="filled">
              <XStack alignItems="center" gap="$x2">
                <AppIcon name="user" size={18} />
                <AppText variant="label">Seller</AppText>
              </XStack>
              <AppText tone="muted" variant="caption">
                A ManaBandhu member. Messages go through in-app chat, so your phone number and email
                stay private until you choose to share them.
              </AppText>
            </Card>
          ) : null}

          <Card variant="tinted">
            <XStack alignItems="flex-start" gap="$x3">
              <AppIcon name="shield" size={20} />
              <YStack flex={1} gap={2}>
                <AppText variant="label">Safe deal tips</AppText>
                <AppText tone="muted" variant="caption">
                  Meet in daylight at a busy public place, inspect the item before paying, and never
                  send gift cards or wire transfers.
                </AppText>
              </YStack>
            </XStack>
          </Card>

          {!listing.isMine ? (
            <XStack>
              <AppButton
                icon="warning"
                label="Report listing"
                onPress={() =>
                  isAuthenticated ? setReportOpen(true) : router.push('/sign-in' as Href)
                }
                variant="ghost"
              />
            </XStack>
          ) : null}
        </YStack>
      </Screen>

      {listing.isMine ? (
        <ActionBar label="Listing actions">
          <OwnerActions
            busy={statusMutation.isPending || deleteMutation.isPending}
            deleting={deleteMutation.isPending}
            listing={listing}
            onDelete={handleDelete}
            onEdit={() => router.push(`/marketplace/${listing.id}/edit` as Href)}
            onStatus={(status) => statusMutation.mutate(status)}
            pendingStatus={statusMutation.isPending ? statusMutation.variables : undefined}
          />
        </ActionBar>
      ) : (
        <ActionBar
          label="Listing actions"
          leading={
            <>
              <AppText tone="primary" variant="h4">
                {price}
              </AppText>
              {statusIs(listing.status, 'reserved') ? (
                <AppText tone="muted" variant="caption">
                  Reserved for another buyer
                </AppText>
              ) : statusIs(listing.status, 'sold') ? (
                <AppText tone="muted" variant="caption">
                  This item has been sold
                </AppText>
              ) : null}
            </>
          }
        >
          <AppButton
            icon="message"
            label="Chat with seller"
            loading={contacting}
            onPress={handleChat}
          />
        </ActionBar>
      )}

      <ReportListingSheet
        listingId={listing.id}
        onClose={() => setReportOpen(false)}
        visible={reportOpen}
      />
    </YStack>
  );
}

function OwnerActions({
  listing,
  busy,
  deleting,
  pendingStatus,
  onStatus,
  onEdit,
  onDelete,
}: {
  listing: MarketplaceListing;
  busy: boolean;
  deleting: boolean;
  pendingStatus?: ListingStatus;
  onStatus: (status: ListingStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const removed = statusIs(listing.status, 'removed');
  return (
    <YStack flex={1} gap="$x2">
      {removed ? (
        <AppText tone="danger" variant="caption">
          A moderator removed this listing. It is hidden from buyers; you can still delete it.
        </AppText>
      ) : null}
      <XStack flexWrap="wrap" gap="$x2" justifyContent="flex-end">
        {!removed ? (
          <AppButton
            disabled={busy}
            icon="pencil"
            label="Edit"
            onPress={onEdit}
            variant="secondary"
          />
        ) : null}
        {ownerStatusActions(listing.status).map((action) => (
          <AppButton
            disabled={busy && pendingStatus !== action.status}
            key={action.status}
            label={action.label}
            loading={pendingStatus === action.status}
            onPress={() => onStatus(action.status)}
            variant={action.status === 'sold' ? 'primary' : 'secondary'}
          />
        ))}
        <AppButton
          disabled={busy && !deleting}
          label="Delete"
          loading={deleting}
          onPress={onDelete}
          variant="danger"
        />
      </XStack>
    </YStack>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <XStack gap="$x3" justifyContent="space-between">
      <AppText tone="muted" variant="label">
        {label}
      </AppText>
      <AppText flex={1} textAlign="right">
        {value}
      </AppText>
    </XStack>
  );
}

function Gallery({
  urls,
  imagesError,
  onRetryImages,
}: {
  urls: string[];
  imagesError: boolean;
  onRetryImages: () => void;
}) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(urls.length - 1, next));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  if (urls.length === 0) {
    return (
      <YStack borderRadius="$card" gap="$x2" overflow="hidden">
        <PhotoPlaceholder
          height={GALLERY_HEIGHT * 0.6}
          label={imagesError ? 'Photos could not be loaded' : 'The seller has not added photos'}
        />
        {imagesError ? (
          <XStack justifyContent="center">
            <AppButton label="Retry photos" onPress={onRetryImages} variant="ghost" />
          </XStack>
        ) : null}
      </YStack>
    );
  }

  return (
    <YStack gap="$x2">
      <YStack
        backgroundColor="$surfaceContainerLow"
        borderRadius="$card"
        height={GALLERY_HEIGHT}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        overflow="hidden"
        position="relative"
      >
        {width > 0 ? (
          <ScrollView
            horizontal
            onMomentumScrollEnd={(e) =>
              setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1)))
            }
            pagingEnabled
            ref={scrollRef}
            showsHorizontalScrollIndicator={false}
          >
            {urls.map((url, i) => (
              <Image
                accessibilityLabel={`Photo ${i + 1} of ${urls.length}`}
                key={url}
                resizeMode="contain"
                source={{ uri: url }}
                style={{ width, height: GALLERY_HEIGHT }}
              />
            ))}
          </ScrollView>
        ) : null}
        {urls.length > 1 ? (
          <>
            <YStack
              backgroundColor="$surface"
              borderRadius="$pill"
              paddingHorizontal="$x2"
              paddingVertical={2}
              position="absolute"
              right={12}
              top={12}
            >
              <AppText variant="caption">
                {index + 1} / {urls.length}
              </AppText>
            </YStack>
            {index > 0 ? (
              <YStack left={8} marginTop={-22} position="absolute" top="50%">
                <IconButton
                  icon="chevron-left"
                  label="Previous photo"
                  onPress={() => goTo(index - 1)}
                  variant="solid"
                />
              </YStack>
            ) : null}
            {index < urls.length - 1 ? (
              <YStack marginTop={-22} position="absolute" right={8} top="50%">
                <IconButton
                  icon="chevron-right"
                  label="Next photo"
                  onPress={() => goTo(index + 1)}
                  variant="solid"
                />
              </YStack>
            ) : null}
          </>
        ) : null}
      </YStack>
      {imagesError ? (
        <XStack alignItems="center" gap="$x2">
          <AppIcon color={theme.colorMuted?.val} name="warning" size={14} />
          <AppText flex={1} tone="muted" variant="caption">
            Only the cover photo could be loaded.
          </AppText>
          <AppButton label="Retry photos" onPress={onRetryImages} variant="ghost" />
        </XStack>
      ) : null}
    </YStack>
  );
}

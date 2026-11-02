import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { Screen } from '@/modules/shared/ui/Screen';
import { getMarketplaceListing } from '../api';
import { ListingForm } from '../components/ListingForm';
import { errorMessage, isNotFound, statusIs } from '../utils/listingRules';

/** `/marketplace/[listingId]/edit`: the owner edits details and photos. */
export function EditListingScreen() {
  const { listingId: rawId } = useLocalSearchParams<{ listingId: string }>();
  const listingId = typeof rawId === 'string' ? rawId : '';
  const listingQuery = useQuery({
    queryKey: ['marketplace', 'listing', listingId],
    queryFn: () => getMarketplaceListing(listingId),
    enabled: Boolean(listingId),
    retry: (count, error) => !isNotFound(error) && count < 2,
  });
  const listing = listingQuery.data;

  if (listingQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/marketplace/mine" />
        <LoadingState label="Loading listing…" />
      </Screen>
    );
  }

  if (!listing || listingQuery.isError || !listing.isMine || statusIs(listing.status, 'removed')) {
    const notFound = !listingId || isNotFound(listingQuery.error);
    const notOwner = Boolean(listing) && !listing?.isMine;
    return (
      <Screen>
        <BackButton fallback="/marketplace/mine" />
        <ErrorState
          body={
            notFound
              ? 'This listing was deleted or is no longer available.'
              : notOwner
                ? 'Only the seller can edit this listing.'
                : listing && statusIs(listing.status, 'removed')
                  ? 'A moderator removed this listing, so it can no longer be edited.'
                  : errorMessage(listingQuery.error)
          }
          onRetry={
            notFound || listing
              ? () => router.replace('/marketplace/mine' as Href)
              : () => listingQuery.refetch()
          }
          retryLabel={notFound || listing ? 'My listings' : 'Retry'}
          title={notFound ? 'Listing not found' : 'Cannot edit this listing'}
        />
      </Screen>
    );
  }

  return <ListingForm initial={listing} key={listing.id} mode="edit" />;
}

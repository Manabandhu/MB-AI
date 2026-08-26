import { ListingDetailsScreen } from '@/modules/marketplace/screens/ListingDetailsScreen';

export default function ListingDetailsRoute({ params }: { params: { listingId: string } }) {
  return <ListingDetailsScreen listingId={params.listingId} />;
}

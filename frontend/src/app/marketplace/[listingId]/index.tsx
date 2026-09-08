import { useRequireAuth } from '@/lib/authStore';
import { ListingDetailsScreen } from '@/modules/marketplace/screens/ListingDetailsScreen';

export default function ListingDetailsRoute({ params }: { params: { listingId: string } }) {
  useRequireAuth('/sign-in');
  return <ListingDetailsScreen listingId={params.listingId} />;
}

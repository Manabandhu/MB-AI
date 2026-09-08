import { useRequireAuth } from '@/lib/authStore';
import { ListingDetailsScreen } from '@/modules/marketplace/screens/ListingDetailsScreen';

export default function ListingDetailsRoute() {
  useRequireAuth('/sign-in');
  return <ListingDetailsScreen />;
}

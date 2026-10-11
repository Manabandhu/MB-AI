import { useRequireAuth } from '@/lib/authStore';
import { EditListingScreen } from '@/modules/marketplace/screens/EditListingScreen';

export default function MarketplaceEditListingRoute() {
  useRequireAuth('/sign-in');
  return <EditListingScreen />;
}

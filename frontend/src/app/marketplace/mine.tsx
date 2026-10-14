import { useRequireAuth } from '@/lib/authStore';
import { MyListingsScreen } from '@/modules/marketplace/screens/MyListingsScreen';

export default function MarketplaceMyListingsRoute() {
  useRequireAuth('/sign-in');
  return <MyListingsScreen />;
}

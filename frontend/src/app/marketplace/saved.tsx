import { useRequireAuth } from '@/lib/authStore';
import { MarketplaceScreen } from '@/modules/marketplace/screens/MarketplaceHomeScreen';

export default function SavedItemsRoute() {
  useRequireAuth('/sign-in');
  return <MarketplaceScreen screenId="saved" />;
}

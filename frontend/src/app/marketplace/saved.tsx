import { useRequireAuth } from '@/lib/authStore';
import { MarketplaceHomeScreen } from '@/modules/marketplace/screens/MarketplaceHomeScreen';

export default function SavedItemsRoute() {
  useRequireAuth('/sign-in');
  return <MarketplaceHomeScreen screenId="saved" />;
}

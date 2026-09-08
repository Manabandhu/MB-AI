import { useRequireAuth } from '@/lib/authStore';
import { SellItemScreen } from '@/modules/marketplace/screens/SellItemScreen';

export default function SellItemRoute() {
  useRequireAuth('/sign-in');
  return <SellItemScreen />;
}

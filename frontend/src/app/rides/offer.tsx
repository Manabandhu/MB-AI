import { useRequireAuth } from '@/lib/authStore';
import { RideOfferScreen } from '@/modules/rides/screens/RideOfferScreen';

export default function RidesOfferRoute() {
  useRequireAuth('/sign-in');
  return <RideOfferScreen />;
}

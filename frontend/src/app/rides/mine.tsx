import { useRequireAuth } from '@/lib/authStore';
import { RideMyListingsScreen } from '@/modules/rides/screens/RideMyListingsScreen';

export default function RidesMineRoute() {
  useRequireAuth('/sign-in');
  return <RideMyListingsScreen />;
}

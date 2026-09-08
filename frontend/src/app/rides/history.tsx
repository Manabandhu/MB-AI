import { useRequireAuth } from '@/lib/authStore';
import { RideHistoryScreen } from '@/modules/rides/screens/RideHistoryScreen';

export default function RidesHistoryRoute() {
  useRequireAuth('/sign-in');
  return <RideHistoryScreen />;
}

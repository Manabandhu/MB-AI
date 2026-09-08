import { useRequireAuth } from '@/lib/authStore';
import { RideDetailScreen } from '@/modules/rides/screens/RideDetailScreen';

export default function RideDetailsRoute() {
  useRequireAuth('/sign-in');
  return <RideDetailScreen />;
}

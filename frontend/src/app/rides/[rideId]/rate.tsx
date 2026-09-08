import { useRequireAuth } from '@/lib/authStore';
import { RideRateScreen } from '@/modules/rides/screens/RideRateScreen';

export default function RideRateRoute() {
  useRequireAuth('/sign-in');
  return <RideRateScreen />;
}

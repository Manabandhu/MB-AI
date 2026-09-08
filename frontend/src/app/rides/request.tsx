import { useRequireAuth } from '@/lib/authStore';
import { RideRequestScreen } from '@/modules/rides/screens/RideRequestScreen';

export default function RidesRequestRoute() {
  useRequireAuth('/sign-in');
  return <RideRequestScreen />;
}

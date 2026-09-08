import { useRequireAuth } from '@/lib/authStore';
import { RideSeatRequestsScreen } from '@/modules/rides/screens/RideSeatRequestsScreen';

export default function RideSeatRequestsRoute() {
  useRequireAuth('/sign-in');
  return <RideSeatRequestsScreen />;
}

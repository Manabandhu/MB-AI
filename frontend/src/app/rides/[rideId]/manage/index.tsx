import { useRequireAuth } from '@/lib/authStore';
import { RideManageScreen } from '@/modules/rides/screens/RideManageScreen';

export default function RideManageRoute() {
  useRequireAuth('/sign-in');
  return <RideManageScreen />;
}

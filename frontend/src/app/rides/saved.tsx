import { useRequireAuth } from '@/lib/authStore';
import { RideSavedScreen } from '@/modules/rides/screens/RideSavedScreen';

export default function RidesSavedRoute() {
  useRequireAuth('/sign-in');
  return <RideSavedScreen />;
}

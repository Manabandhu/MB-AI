import { useRequireAuth } from '@/lib/authStore';
import { RidesScreen } from '@/modules/rides/screens/RidesScreen';

export default function RidesMapRoute() {
  useRequireAuth('/sign-in');
  return <RidesScreen screenId="map" />;
}

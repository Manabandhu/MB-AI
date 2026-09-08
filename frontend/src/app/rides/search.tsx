import { useRequireAuth } from '@/lib/authStore';
import { RidesScreen } from '@/modules/rides/screens/RidesScreen';

export default function RidesSearchRoute() {
  useRequireAuth('/sign-in');
  return <RidesScreen screenId="search" />;
}

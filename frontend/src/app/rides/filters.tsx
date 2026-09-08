import { useRequireAuth } from '@/lib/authStore';
import { RidesScreen } from '@/modules/rides/screens/RidesScreen';

export default function RidesFiltersRoute() {
  useRequireAuth('/sign-in');
  return <RidesScreen screenId="filters" />;
}

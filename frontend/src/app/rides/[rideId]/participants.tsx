import { useRequireAuth } from '@/lib/authStore';
import { RideParticipantsScreen } from '@/modules/rides/screens/RideParticipantsScreen';

export default function RideParticipantsRoute() {
  useRequireAuth('/sign-in');
  return <RideParticipantsScreen />;
}

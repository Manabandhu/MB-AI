import { useRequireAuth } from '@/lib/authStore';
import { SavedJobsScreen } from '@/modules/jobs/screens/SavedJobsScreen';

export default function SavedJobsRoute() {
  useRequireAuth('/sign-in');
  return <SavedJobsScreen />;
}

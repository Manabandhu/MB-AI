import { useRequireAuth } from '@/lib/authStore';
import { JobsScreen } from '@/modules/jobs/screens/JobsHomeScreen';

export default function SavedJobsRoute() {
  useRequireAuth('/sign-in');
  return <JobsScreen screenId="saved" />;
}

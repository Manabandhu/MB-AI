import { useRequireAuth } from '@/lib/authStore';
import { JobDetailsScreen } from '@/modules/jobs/screens/JobDetailsScreen';

export default function JobDetailsRoute() {
  useRequireAuth('/sign-in');
  return <JobDetailsScreen />;
}
import { useRequireAuth } from '@/lib/authStore';
import { JobsFiltersScreen } from '@/modules/jobs/screens/JobsFiltersScreen';

export default function JobsFiltersRoute() {
  useRequireAuth('/sign-in');
  return <JobsFiltersScreen />;
}

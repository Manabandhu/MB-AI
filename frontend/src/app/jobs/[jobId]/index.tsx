import { useRequireAuth } from '@/lib/authStore';
import { JobDetailsScreen } from '@/modules/jobs/screens/JobDetailsScreen';

export default function JobDetailsRoute({ params }: { params: { jobId: string } }) {
  useRequireAuth('/sign-in');
  return <JobDetailsScreen jobId={params.jobId} />;
}

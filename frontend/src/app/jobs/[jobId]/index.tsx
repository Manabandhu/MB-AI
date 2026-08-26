import { JobDetailsScreen } from '@/modules/jobs/screens/JobDetailsScreen';

export default function JobDetailsRoute({ params }: { params: { jobId: string } }) {
  return <JobDetailsScreen jobId={params.jobId} />;
}

import { formatSalaryRange } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { persistMeta } from '@/lib/queryPersistence';
import { ListRow } from '@/modules/shared/ui/ListRow';
import { WidgetFrame } from '@/modules/shared/ui/WidgetFrame';
import { listJobPostings } from '../api';

/** Newest job postings. */
export function JobsHomeWidget() {
  const query = useQuery({
    queryKey: ['jobs', 'home-widget'],
    queryFn: () => listJobPostings(0, 3),
    staleTime: 60_000,
    meta: persistMeta,
  });
  const jobs = (query.data ?? []).slice(0, 3);
  return (
    <WidgetFrame
      empty={{
        title: 'No jobs posted yet',
        body: 'Know an opening? Share it with the community.',
        actionLabel: 'Post a job',
        actionHref: '/jobs/post',
      }}
      icon="briefcase"
      isEmpty={jobs.length === 0}
      isError={query.isError}
      isLoading={query.isLoading}
      onRetry={() => query.refetch()}
      seeAll={{ href: '/jobs' }}
      title="New jobs"
    >
      {jobs.map((job) => (
        <ListRow
          href={`/jobs/${job.id}`}
          icon="briefcase"
          key={job.id}
          meta={formatSalaryRange(job.salaryMin, job.salaryMax, { period: '' })}
          subtitle={[job.company, job.isRemote ? 'Remote' : job.location]
            .filter(Boolean)
            .join(' · ')}
          title={job.title}
          tone="warm"
        />
      ))}
    </WidgetFrame>
  );
}

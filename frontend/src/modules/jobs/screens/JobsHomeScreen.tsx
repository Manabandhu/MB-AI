import { useQuery } from '@tanstack/react-query';
import { getJobsScreen } from '@/modules/jobs/api';
import { jobsScreenFallbacks } from '@/modules/jobs/jobsFallbacks';
import { FeatureScreen } from '@/modules/shared/components/FeatureScreen';

type JobsScreenProps = {
  screenId: keyof typeof jobsRoutes;
};

export function JobsScreen({ screenId }: JobsScreenProps) {
  const fallback = jobsScreenFallbacks[screenId];
  const screen = useQuery({
    queryKey: ['jobs', 'screen', screenId],
    queryFn: () => getJobsScreen(screenId),
  });
  const data = screen.data ?? fallback;

  return (
    <FeatureScreen
      actions={jobsActions[screenId]}
      cards={data.items}
      currentRoute={jobsRoutes[screenId]}
      eyebrow={data.eyebrow}
      metrics={data.metrics}
      subtitle={data.subtitle}
      title={data.title}
    />
  );
}

const jobsRoutes = {
  home: '/jobs',
  search: '/jobs/search',
  filters: '/jobs/filters',
  saved: '/jobs/saved',
  post: '/jobs/post',
} as const;

const jobsActions = {
  home: [
    { label: 'Search jobs', route: '/jobs/search' },
    { label: 'Filters', route: '/jobs/filters' },
    { label: 'Saved jobs', route: '/jobs/saved' },
    { label: 'Post job', route: '/jobs/post' },
  ],
  search: [
    { label: 'Filters', route: '/jobs/filters' },
    { label: 'Saved jobs', route: '/jobs/saved' },
    { label: 'Post job', route: '/jobs/post' },
  ],
  filters: [
    { label: 'Apply to search', route: '/jobs/search' },
    { label: 'Saved jobs', route: '/jobs/saved' },
  ],
  saved: [
    { label: 'Search jobs', route: '/jobs/search' },
    { label: 'Post job', route: '/jobs/post' },
  ],
  post: [
    { label: 'Search jobs', route: '/jobs/search' },
    { label: 'Saved jobs', route: '/jobs/saved' },
  ],
} as const;

import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const jobsScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Jobs',
    title: 'Find your next opportunity',
    subtitle: 'Browse jobs with trusted employers and community signals.',
    metrics: [
      { label: 'Open roles', value: '86' },
      { label: 'Employers', value: '24' },
    ],
    items: [
      {
        id: 'job-1',
        title: 'Software Engineer',
        body: 'Remote · Full-time · $120k',
        meta: 'New',
        route: '/jobs/1',
      },
      {
        id: 'job-2',
        title: 'Data Analyst',
        body: 'Hybrid · Contract · $85k',
        meta: 'Popular',
        route: '/jobs/2',
      },
    ],
  },
  search: {
    eyebrow: 'Jobs',
    title: 'Search jobs',
    subtitle: 'Find roles by skill, location, and employment type.',
    metrics: [
      { label: 'Results', value: '42' },
      { label: 'Filters', value: '6' },
    ],
    items: [
      {
        id: 'filter-1',
        title: 'Software Engineer',
        body: 'Remote · Full-time',
        meta: '$120k',
        route: '/jobs/1',
      },
      {
        id: 'filter-2',
        title: 'Data Analyst',
        body: 'Hybrid · Contract',
        meta: '$85k',
        route: '/jobs/2',
      },
    ],
  },
  filters: {
    eyebrow: 'Jobs',
    title: 'Job filters',
    subtitle: 'Narrow results by location, type, salary, and experience.',
    metrics: [
      { label: 'Active filters', value: '3' },
      { label: 'Matches', value: '18' },
    ],
    items: [
      {
        id: 'location',
        title: 'Location',
        body: 'Remote, hybrid, or specific cities.',
        meta: 'Core',
      },
      {
        id: 'type',
        title: 'Employment type',
        body: 'Full-time, part-time, contract, internship.',
        meta: 'Core',
      },
    ],
  },
  saved: {
    eyebrow: 'Jobs',
    title: 'Saved jobs',
    subtitle: 'Review your bookmarked opportunities.',
    metrics: [
      { label: 'Saved', value: '5' },
      { label: 'Applied', value: '2' },
    ],
    items: [
      {
        id: 'saved-1',
        title: 'Software Engineer',
        body: 'Remote · Full-time',
        meta: '$120k',
        route: '/jobs/1',
      },
    ],
  },
  post: {
    eyebrow: 'Jobs',
    title: 'Post a job',
    subtitle: 'Create a job listing for the community.',
    metrics: [
      { label: 'Steps', value: '4' },
      { label: 'Required', value: 'Title, company, location' },
    ],
    items: [
      {
        id: 'basics',
        title: 'Basics',
        body: 'Title, company, location, and employment type.',
        meta: 'Step 1',
      },
      {
        id: 'details',
        title: 'Details',
        body: 'Description, requirements, and benefits.',
        meta: 'Step 2',
      },
    ],
  },
};

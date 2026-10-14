import type { JobPosting } from '@/modules/jobs/types';

export type JobSort = 'newest' | 'salary';

/** Every filter here is applied to real posting fields; nothing is inferred from free text except the search. */
export type JobFilters = {
  keyword: string;
  location: string;
  categoryId: string | null;
  remoteOnly: boolean;
  employmentType: string | null;
  minSalary: number;
  sort: JobSort;
};

export const DEFAULT_JOB_FILTERS: JobFilters = {
  keyword: '',
  location: '',
  categoryId: null,
  remoteOnly: false,
  employmentType: null,
  minSalary: 0,
  sort: 'newest',
};

const lower = (v?: string | null) => (v ?? '').toLowerCase();

/** Open postings that match `filters`, sorted. Closed postings stay reachable by link but are not listed. */
export function filterJobs(jobs: JobPosting[], filters: JobFilters): JobPosting[] {
  const keyword = filters.keyword.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  return jobs
    .filter((job) => lower(job.status) === 'open' || !job.status)
    .filter((job) => {
      if (keyword) {
        const haystack = [job.title, job.company, job.description, job.category?.name]
          .map(lower)
          .join(' ');
        if (!haystack.includes(keyword)) return false;
      }
      if (location && !lower(job.location).includes(location)) {
        // "remote" in the location box also matches remote postings.
        if (!(job.isRemote && 'remote'.includes(location))) return false;
      }
      if (filters.categoryId && job.category?.id !== filters.categoryId) return false;
      if (filters.remoteOnly && !job.isRemote) return false;
      if (filters.employmentType && lower(job.employmentType) !== lower(filters.employmentType)) {
        return false;
      }
      if (filters.minSalary > 0 && (job.salaryMax ?? job.salaryMin ?? 0) < filters.minSalary) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === 'salary') {
        return (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/** Number of filters that narrow the list (search text excluded), for the "Filters (n)" label. */
export function activeFilterCount(filters: JobFilters) {
  return [
    filters.location.trim(),
    filters.categoryId,
    filters.remoteOnly,
    filters.employmentType,
    filters.minSalary > 0,
  ].filter(Boolean).length;
}

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Reads filters from URL params (`/jobs/search?q=…&remote=1&type=…&minSalary=…&category=…&location=…`). */
export function filtersFromParams(params: Params): JobFilters {
  const minSalary = Number(one(params.minSalary));
  return {
    keyword: one(params.q),
    location: one(params.location),
    categoryId: one(params.category) || null,
    remoteOnly: one(params.remote) === '1',
    employmentType: one(params.type) || null,
    minSalary: Number.isFinite(minSalary) && minSalary > 0 ? minSalary : 0,
    sort: one(params.sort) === 'salary' ? 'salary' : 'newest',
  };
}

export function filtersToQuery(filters: JobFilters): string {
  const query = new URLSearchParams();
  if (filters.keyword.trim()) query.set('q', filters.keyword.trim());
  if (filters.location.trim()) query.set('location', filters.location.trim());
  if (filters.categoryId) query.set('category', filters.categoryId);
  if (filters.remoteOnly) query.set('remote', '1');
  if (filters.employmentType) query.set('type', filters.employmentType);
  if (filters.minSalary > 0) query.set('minSalary', String(filters.minSalary));
  if (filters.sort !== 'newest') query.set('sort', filters.sort);
  return query.toString();
}

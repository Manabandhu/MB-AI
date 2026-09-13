import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type { JobCategory, JobPosting } from '@/modules/jobs/types';

export async function getJobsScreen(screenId: string): Promise<CatalogScreenContent> {
  return parseJsonOrThrow(await apiFetch(`/api/v1/jobs/screens/${screenId}`), 'Jobs screen');
}

export async function listJobPostings(page = 0, size = 20): Promise<JobPosting[]> {
  const response = await apiFetch(`/api/v1/jobs?page=${page}&size=${size}`);
  const data = await parseJsonOrThrow<any>(response, 'Job postings');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function getJobPosting(jobId: string): Promise<JobPosting> {
  const response = await apiFetch(`/api/v1/jobs/${jobId}`);
  return parseJsonOrThrow<JobPosting>(response, 'Job posting detail');
}

export async function listJobCategories(): Promise<JobCategory[]> {
  const response = await apiFetch('/api/v1/jobs/categories');
  return parseJsonOrThrow<JobCategory[]>(response, 'Job categories');
}

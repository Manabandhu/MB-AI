import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import { type RawPage, toPage } from '@/lib/springPage';
import type { CreateJobInput, JobPosting } from '@/modules/jobs/types';

export async function listJobPostings(page = 0, size = 20): Promise<JobPosting[]> {
  const response = await apiFetch(`/api/v1/jobs?page=${page}&size=${size}`);
  const data = await parseJsonOrThrow<RawPage<JobPosting>>(response, 'Job postings');
  return toPage(data, page, size).content;
}

export async function getJobPosting(jobId: string): Promise<JobPosting> {
  const response = await apiFetch(`/api/v1/jobs/${jobId}`);
  return parseJsonOrThrow<JobPosting>(response, 'Job posting detail');
}

export async function createJobPosting(input: CreateJobInput): Promise<JobPosting> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/jobs', { method: 'POST', body: JSON.stringify(input) }),
    'Create job posting',
  );
}

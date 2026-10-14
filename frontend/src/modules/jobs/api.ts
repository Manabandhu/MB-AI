import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';
import { type Page, type RawPage, toPage } from '@/lib/springPage';
import type {
  CreateJobInput,
  JobApplication,
  JobCategory,
  JobPosting,
  UpdateJobInput,
} from '@/modules/jobs/types';

export async function listJobPostings(page = 0, size = 20): Promise<JobPosting[]> {
  const response = await apiFetch(`/api/v1/jobs?page=${page}&size=${size}`);
  const data = await parseJsonOrThrow<RawPage<JobPosting>>(response, 'Job postings');
  return toPage(data, page, size).content;
}

/** One page of open postings, newest first, with the server's total. */
export async function listJobPostingsPage(page = 0, size = 50): Promise<Page<JobPosting>> {
  const response = await apiFetch(`/api/v1/jobs?page=${page}&size=${size}`);
  return toPage(await parseJsonOrThrow<RawPage<JobPosting>>(response, 'Job postings'), page, size);
}

export async function getJobPosting(jobId: string): Promise<JobPosting> {
  const response = await apiFetch(`/api/v1/jobs/${encodeURIComponent(jobId)}`);
  return parseJsonOrThrow<JobPosting>(response, 'Job posting detail');
}

export async function listJobCategories(): Promise<JobCategory[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/jobs/categories'), 'Job categories');
}

export async function createJobPosting(input: CreateJobInput): Promise<JobPosting> {
  return parseJson(await apiFetch('/api/v1/jobs', { method: 'POST', body: JSON.stringify(input) }));
}

/** Owner (or admin) edits a posting; `status: 'closed'` stops new applications. */
export async function updateJobPosting(jobId: string, input: UpdateJobInput): Promise<JobPosting> {
  return parseJson(
    await apiFetch(`/api/v1/jobs/${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteJobPosting(jobId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/jobs/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) await parseJson(response);
}

/** Applies in the app; the server refuses your own posting, closed jobs, and a second live application. */
export async function applyToJob(
  jobId: string,
  input: { coverLetter?: string; resumeUrl?: string },
): Promise<JobApplication> {
  return parseJson(
    await apiFetch(`/api/v1/jobs/${encodeURIComponent(jobId)}/applications`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

/** Applicants for your own posting (owner and admins only). */
export async function listJobApplications(jobId: string): Promise<JobApplication[]> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/jobs/${encodeURIComponent(jobId)}/applications`),
    'Applications',
  );
}

import { z } from 'zod';
import type { CreateJobInput, JobPosting, UpdateJobInput } from '@/modules/jobs/types';

const optionalSalary = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{1,9}$/.test(v.replace(/[,$\s]/g, '')), 'Whole dollars only');

/** Form values are strings as typed; `toJobInput` turns them into the backend's `CreateJobPostingInput`. */
export const jobFormSchema = z
  .object({
    categoryId: z.string().min(1, 'Choose a category'),
    title: z
      .string()
      .trim()
      .min(1, 'Add a job title')
      .max(200, 'Keep the title under 200 characters'),
    company: z.string().trim().max(200, 'Keep the company under 200 characters'),
    location: z.string().trim().max(200, 'Keep the location under 200 characters'),
    isRemote: z.boolean(),
    employmentType: z.string(),
    salaryMin: optionalSalary,
    salaryMax: optionalSalary,
    applicationUrl: z
      .string()
      .trim()
      .max(500, 'Keep the link under 500 characters')
      .refine(
        (v) => v === '' || /^https?:\/\/\S+\.\S+/i.test(v),
        'Use a full link starting with https://',
      ),
    description: z
      .string()
      .trim()
      .min(1, 'Describe the role')
      .max(4000, 'Keep the description under 4000 characters'),
  })
  .refine(
    (v) => {
      const min = parseSalary(v.salaryMin);
      const max = parseSalary(v.salaryMax);
      return min === undefined || max === undefined || max >= min;
    },
    { message: 'Maximum must be at least the minimum', path: ['salaryMax'] },
  );

export type JobFormValues = z.infer<typeof jobFormSchema>;

export const EMPTY_JOB_FORM: JobFormValues = {
  categoryId: '',
  title: '',
  company: '',
  location: '',
  isRemote: false,
  employmentType: '',
  salaryMin: '',
  salaryMax: '',
  applicationUrl: '',
  description: '',
};

/** Whole dollars from "120,000", "$120000" or ""; `undefined` when empty. */
export function parseSalary(value: string): number | undefined {
  const digits = value.replace(/[,$\s]/g, '');
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

export function toJobInput(values: JobFormValues): CreateJobInput {
  const text = (v: string) => (v.trim() ? v.trim() : undefined);
  return {
    categoryId: values.categoryId,
    title: values.title.trim(),
    company: text(values.company),
    location: text(values.location),
    description: values.description.trim(),
    employmentType: text(values.employmentType),
    isRemote: values.isRemote,
    salaryMin: parseSalary(values.salaryMin),
    salaryMax: parseSalary(values.salaryMax),
    applicationUrl: text(values.applicationUrl),
  };
}

/**
 * Edit payload: every field is sent so the posting matches the form. Cleared optional text is sent as `''`
 * (the server clears it) and `clearSalary` resets both bounds before the entered ones apply.
 */
export function toJobUpdate(values: JobFormValues): UpdateJobInput {
  return {
    categoryId: values.categoryId,
    title: values.title.trim(),
    company: values.company.trim(),
    location: values.location.trim(),
    description: values.description.trim(),
    employmentType: values.employmentType.trim(),
    isRemote: values.isRemote,
    applicationUrl: values.applicationUrl.trim(),
    clearSalary: true,
    salaryMin: parseSalary(values.salaryMin),
    salaryMax: parseSalary(values.salaryMax),
  };
}

export function fromJob(job: JobPosting): JobFormValues {
  return {
    categoryId: job.category?.id ?? '',
    title: job.title ?? '',
    company: job.company ?? '',
    location: job.location ?? '',
    isRemote: Boolean(job.isRemote),
    employmentType: job.employmentType ?? '',
    salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
    salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
    applicationUrl: job.applicationUrl ?? '',
    description: job.description ?? '',
  };
}

/** Case-insensitive status check (statuses are stored lowercase). */
export function jobStatusIs(job: Pick<JobPosting, 'status'>, status: string) {
  return (job.status ?? '').toLowerCase() === status.toLowerCase();
}

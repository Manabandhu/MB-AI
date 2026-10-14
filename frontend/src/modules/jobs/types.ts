export type JobCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
};

export type JobPosting = {
  id: string;
  /** True when the signed-in caller owns the posting; job reads are public, so owner ids are never sent. */
  mine?: boolean | null;
  category?: JobCategory | null;
  title: string;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  employmentType?: string | null;
  isRemote?: boolean | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  applicationUrl?: string | null;
  /** Lowercase in the database (`open`, `closed`); compare case-insensitively. */
  status: string;
  createdAt: string;
  updatedAt: string;
};

/** Mirrors the backend `CreateJobPostingInput`. */
export type CreateJobInput = {
  categoryId: string;
  title: string;
  company?: string;
  description: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote?: boolean;
  applicationUrl?: string;
};

/**
 * Mirrors `UpdateJobPostingInput`: an omitted field stays unchanged, `''` clears an optional text field, and
 * `clearSalary` empties both salary bounds before `salaryMin`/`salaryMax` apply.
 */
export type UpdateJobInput = Partial<CreateJobInput> & {
  status?: 'open' | 'closed';
  clearSalary?: boolean;
};

export type JobApplication = {
  id: string;
  jobPostingId: string;
  applicantId: string;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  status: string;
  appliedAt?: string;
};

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const;

/** Readable employment type: the form stores `Full-time` etc.; API clients may send enum-style `FULL_TIME`. */
export function employmentTypeLabel(value: string): string {
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  const known = EMPLOYMENT_TYPES.find((type) => type.toLowerCase() === key);
  if (known) return known;
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

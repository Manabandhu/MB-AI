export type JobCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
};

export type JobPosting = {
  id: string;
  ownerId: string;
  categoryId?: string;
  category?: JobCategory;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  employmentType?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  applicationUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type JobListing = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | string;
  savedByViewer?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobInput = {
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  categoryId?: string;
  isRemote?: boolean;
  applicationUrl?: string;
};

export type UpdateJobInput = Partial<CreateJobInput> & {
  status?: string;
};

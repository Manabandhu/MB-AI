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

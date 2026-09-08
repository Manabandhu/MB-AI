export type JobListing = {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salaryMin?: number;
  salaryMax?: number;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  savedByViewer: boolean;
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
};

export type UpdateJobInput = Partial<CreateJobInput> & {
  status?: string;
};

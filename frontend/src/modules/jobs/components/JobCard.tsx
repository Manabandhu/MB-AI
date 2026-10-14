import { formatRelative, formatSalaryRange } from '@manabandhu/core';
import type { Href } from 'expo-router';
import { XStack } from 'tamagui';
import type { JobPosting } from '@/modules/jobs/types';
import { jobStatusIs } from '@/modules/jobs/utils/jobForm';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

/** A job in a list: title, company and place, salary when listed, type badges. Opens the job. */
export function JobCard({ job }: { job: JobPosting }) {
  const salary = formatSalaryRange(job.salaryMin, job.salaryMax);
  const where = job.location || (job.isRemote ? 'Remote' : null);
  return (
    <Card aria-label={job.title} href={`/jobs/${job.id}` as Href}>
      <Heading numberOfLines={2} variant="h4">
        {job.title}
      </Heading>
      <AppText numberOfLines={1} tone="muted">
        {[job.company, where].filter(Boolean).join(' · ') || 'Company not listed'}
      </AppText>
      <XStack alignItems="center" flexWrap="wrap" gap="$x2">
        {salary ? <StatusBadge label={salary} tone="success" /> : null}
        {job.employmentType ? <StatusBadge label={job.employmentType} /> : null}
        {job.isRemote ? <StatusBadge icon="globe" label="Remote OK" tone="info" /> : null}
        {job.category?.name ? <StatusBadge label={job.category.name} tone="primary" /> : null}
        {!jobStatusIs(job, 'open') ? <StatusBadge label="Closed" tone="warning" /> : null}
      </XStack>
      <AppText tone="muted" variant="caption">
        Posted {formatRelative(job.createdAt) ?? ''}
      </AppText>
    </Card>
  );
}

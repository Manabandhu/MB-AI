import { type AdminJob, listAdminJobs } from '@/modules/admin/api';
import {
  AdminModerationList,
  ModerationBadges,
} from '@/modules/admin/components/AdminModerationList';
import { ListRow } from '@/modules/shared/ui';

const searchText = (j: AdminJob) => [j.title, j.company];

export default function AdminJobsScreen() {
  return (
    <AdminModerationList
      emptyIcon="briefcase"
      noun="jobs"
      queryFn={listAdminJobs}
      queryKey={['admin', 'jobs']}
      renderItem={(j) => (
        <ListRow
          footer={<ModerationBadges reported={j.reported} status={j.status} />}
          href={`/jobs/${j.id}`}
          icon="briefcase"
          key={j.id}
          subtitle={j.company}
          title={j.title}
        />
      )}
      searchPlaceholder="Search jobs"
      searchText={searchText}
      subtitle="Moderate job listings and referrals."
      title="Jobs"
    />
  );
}

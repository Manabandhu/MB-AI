import { type AdminCommunityPost, listAdminCommunityPosts } from '@/modules/admin/api';
import {
  AdminModerationList,
  ModerationBadges,
} from '@/modules/admin/components/AdminModerationList';
import { ListRow } from '@/modules/shared/ui';

const searchText = (p: AdminCommunityPost) => [p.title, p.authorName];

export default function AdminCommunityScreen() {
  return (
    <AdminModerationList
      emptyIcon="community"
      noun="community posts"
      queryFn={listAdminCommunityPosts}
      queryKey={['admin', 'community']}
      renderItem={(p) => (
        <ListRow
          footer={<ModerationBadges reported={p.reported} status={p.status} />}
          href={`/community/posts/${p.id}`}
          icon="community"
          key={p.id}
          subtitle={`By ${p.authorName} in ${p.communityName}`}
          title={p.title}
        />
      )}
      searchPlaceholder="Search posts"
      searchText={searchText}
      subtitle="Moderate community posts and discussions."
      title="Community posts"
    />
  );
}

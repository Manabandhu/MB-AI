import { type AdminEvent, listAdminEvents } from '@/modules/admin/api';
import {
  AdminModerationList,
  ModerationBadges,
} from '@/modules/admin/components/AdminModerationList';
import { ListRow } from '@/modules/shared/ui';

const searchText = (e: AdminEvent) => [e.title, e.organizer];

export default function AdminEventsScreen() {
  return (
    <AdminModerationList
      emptyIcon="event"
      noun="events"
      queryFn={listAdminEvents}
      queryKey={['admin', 'events']}
      renderItem={(e) => (
        <ListRow
          footer={<ModerationBadges reported={e.reported} status={e.status} />}
          href={`/events/${e.id}`}
          icon="event"
          key={e.id}
          meta={e.date}
          subtitle={`Organizer: ${e.organizer}`}
          title={e.title}
        />
      )}
      searchPlaceholder="Search events"
      searchText={searchText}
      subtitle="Moderate community events."
      title="Events"
    />
  );
}

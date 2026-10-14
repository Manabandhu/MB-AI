import { type AdminRoom, listAdminRooms } from '@/modules/admin/api';
import {
  AdminModerationList,
  ModerationBadges,
} from '@/modules/admin/components/AdminModerationList';
import { ListRow } from '@/modules/shared/ui';

const searchText = (r: AdminRoom) => [r.title, r.hostName];

export default function AdminRoomsScreen() {
  return (
    <AdminModerationList
      emptyIcon="bed"
      noun="rooms"
      queryFn={listAdminRooms}
      queryKey={['admin', 'rooms']}
      renderItem={(r) => (
        <ListRow
          footer={<ModerationBadges reported={r.reported} status={r.status} />}
          href={`/rooms/${r.id}`}
          icon="bed"
          key={r.id}
          subtitle={`Host: ${r.hostName}`}
          title={r.title}
        />
      )}
      searchPlaceholder="Search rooms"
      searchText={searchText}
      subtitle="Moderate room listings."
      title="Rooms"
    />
  );
}

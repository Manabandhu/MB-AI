import { type AdminRide, listAdminRides } from '@/modules/admin/api';
import {
  AdminModerationList,
  ModerationBadges,
} from '@/modules/admin/components/AdminModerationList';
import { ListRow } from '@/modules/shared/ui';

const searchText = (r: AdminRide) => [`${r.from} ${r.to}`, r.driverName ?? r.driverId];

export default function AdminRidesScreen() {
  return (
    <AdminModerationList
      emptyIcon="car"
      noun="rides"
      queryFn={listAdminRides}
      queryKey={['admin', 'rides']}
      renderItem={(r) => (
        <ListRow
          footer={<ModerationBadges reported={r.reported} status={r.status} />}
          href={`/rides/${r.id}`}
          icon="car"
          key={r.id}
          subtitle={`Driver: ${r.driverName ?? r.driverId}`}
          title={`${r.from} → ${r.to}`}
        />
      )}
      searchPlaceholder="Search rides"
      searchText={searchText}
      subtitle="Moderate ride listings."
      title="Rides"
    />
  );
}

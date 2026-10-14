import { type AuditLogEntry, listAuditLog } from '@/modules/admin/api';
import { AdminModerationList } from '@/modules/admin/components/AdminModerationList';
import { AppText, Card } from '@/modules/shared/ui';

const searchText = (l: AuditLogEntry) => [l.action, l.actor];

export default function AdminAuditLogScreen() {
  return (
    <AdminModerationList
      emptyIcon="list"
      noun="log entries"
      queryFn={listAuditLog}
      queryKey={['admin', 'audit-log']}
      renderItem={(l) => (
        <Card gap="$x1" key={l.id} padding="$x3">
          <AppText variant="bodyStrong">{l.action}</AppText>
          <AppText tone="muted" variant="caption">
            Actor: {l.actor} · Target: {l.targetType}:{l.targetId}
          </AppText>
          <AppText tone="primary" variant="label">
            {new Date(l.createdAt).toLocaleString()}
          </AppText>
        </Card>
      )}
      searchPlaceholder="Search audit log"
      searchText={searchText}
      subtitle="System events and admin action history."
      title="Audit log"
    />
  );
}

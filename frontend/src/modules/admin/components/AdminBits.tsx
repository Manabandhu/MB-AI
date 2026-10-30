import { StatusBadge, type StatusTone } from '@/modules/shared/ui';
import {
  type AdminRole,
  adminRoleLabel,
  isOpenReport,
  isSuspended,
  statusLabel,
} from '../utils/adminAccess';

/** The caller's real role (from the signed token), replacing the old hard-coded "SUPER ADMIN" badge. */
export function AdminRoleBadge({ role }: { role: AdminRole | null }) {
  if (!role) return null;
  return <StatusBadge icon="verified-user" label={adminRoleLabel(role)} tone="primary" />;
}

export function UserStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge label={statusLabel(status)} tone={isSuspended(status) ? 'danger' : 'success'} />
  );
}

export function ReportStatusBadge({ status }: { status: string }) {
  const value = (status ?? '').toUpperCase();
  const tone: StatusTone = isOpenReport(status)
    ? value === 'IN_REVIEW'
      ? 'info'
      : 'warning'
    : value === 'RESOLVED'
      ? 'success'
      : 'neutral';
  return <StatusBadge label={statusLabel(status)} tone={tone} />;
}

/** "user" → "Member"; admin roles get their label. */
export function memberRoleLabel(role: string | null | undefined) {
  const value = (role ?? '').trim().toUpperCase();
  if (value === 'SUPER_ADMIN') return 'Super admin';
  if (value === 'ADMIN') return 'Admin';
  return 'Member';
}

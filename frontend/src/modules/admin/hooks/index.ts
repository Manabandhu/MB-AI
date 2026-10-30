import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { showError } from '@/modules/shared/ui/notify';
import { type AdminReport, type AdminUser, resolveReport, updateUserStatus } from '../api';
import { isSuspended } from '../utils/adminAccess';

/**
 * Suspend / reactivate with a confirm sheet (red for suspend). Errors are shown, including the server's reason
 * (own account, super admin, admin without super-admin rights). `pendingId` marks the one row in flight.
 */
export function useUserStatusAction() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (user) => {
      queryClient.setQueryData(['admin', 'user', user.id], user);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
    },
    onError: (error) => showError('Status not changed', error),
  });
  const toggle = async (user: AdminUser) => {
    const suspend = !isSuspended(user.status);
    const name = user.name && user.name !== '—' ? user.name : user.email;
    const ok = await confirm(
      suspend
        ? {
            title: `Suspend ${name}?`,
            body: 'They are signed out and cannot sign in again until an admin reactivates the account. This is recorded in the audit log.',
            confirmLabel: 'Suspend account',
            destructive: true,
          }
        : {
            title: `Reactivate ${name}?`,
            body: 'They can sign in again straight away. This is recorded in the audit log.',
            confirmLabel: 'Reactivate account',
          },
    );
    if (ok) mutation.mutate({ id: user.id, status: suspend ? 'Suspended' : 'Active' });
  };
  return {
    toggle,
    pendingId: mutation.isPending ? mutation.variables?.id : undefined,
    error: mutation.error,
  };
}

/** Resolve a report after a (red) confirmation; only the row being resolved shows progress. */
export function useResolveReportAction() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const mutation = useMutation({
    mutationFn: resolveReport,
    onSuccess: (report) => {
      queryClient.setQueryData<AdminReport[]>(['admin', 'reports'], (old) =>
        old?.map((r) => (r.id === report.id ? report : r)),
      );
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-log'] });
    },
    onError: (error) => showError('Report not resolved', error),
  });
  const resolve = async (report: AdminReport) => {
    const ok = await confirm({
      title: 'Resolve this report?',
      body: 'It leaves the open queue and the reporter can no longer expect follow-up on it. This is recorded in the audit log.',
      confirmLabel: 'Resolve report',
      destructive: true,
    });
    if (ok) mutation.mutate(report.id);
  };
  return {
    resolve,
    pendingId: mutation.isPending ? mutation.variables : undefined,
    error: mutation.error,
  };
}

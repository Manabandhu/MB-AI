import { useAuthStore } from '@/lib/authStore';
import { type AdminRole, adminRoleOf, hasAdminAccess } from './adminAccess';

/** The signed-in member's admin role and whether they may open a screen that needs `required`. */
export function useAdminAccess(required: AdminRole = 'ADMIN') {
  const status = useAuthStore((s) => s.status);
  const identityRole = useAuthStore((s) => s.identity?.role);
  const appMetadata = useAuthStore((s) => s.user?.app_metadata);
  const role = adminRoleOf(identityRole, appMetadata);
  return {
    role,
    checking: status === 'loading',
    allowed: hasAdminAccess(role, required),
  };
}

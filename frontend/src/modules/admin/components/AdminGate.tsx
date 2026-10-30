import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { Screen, SkeletonCard } from '@/modules/shared/ui';
import type { AdminRole } from '../adminAccess';
import { useAdminAccess } from '../useAdminAccess';

/**
 * Shows admin screens only to members whose signed role allows them, and a plain "not authorized" state to
 * everyone else instead of a console full of failed requests. The backend still authorizes every call.
 */
export function AdminGate({
  children,
  require = 'ADMIN',
}: {
  children: ReactNode;
  require?: AdminRole;
}) {
  const { allowed, checking } = useAdminAccess(require);
  if (checking) {
    return (
      <Screen>
        <SkeletonCard lines={3} />
      </Screen>
    );
  }
  if (!allowed) {
    return (
      <Screen>
        <EmptyState
          actionLabel="Go to Home"
          body={
            require === 'SUPER_ADMIN'
              ? 'This page is only available to super admins.'
              : 'The admin console is only available to ManaBandhu moderators.'
          }
          iconName="lock"
          onAction={() => router.replace('/home' as Href)}
          title="Not authorized"
        />
      </Screen>
    );
  }
  return <>{children}</>;
}

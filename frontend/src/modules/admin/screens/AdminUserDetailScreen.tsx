import { formatDate } from '@manabandhu/core';
import { useQuery } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { XStack, YStack } from 'tamagui';
import { getAdminUser } from '@/modules/admin/api';
import { memberRoleLabel, UserStatusBadge } from '@/modules/admin/components/AdminBits';
import { useUserStatusAction } from '@/modules/admin/hooks';
import { isSuspended } from '@/modules/admin/utils/adminAccess';
import {
  AppButton,
  AppText,
  Avatar,
  Card,
  Screen,
  ScreenHeader,
  Section,
  SkeletonCard,
  StatusBadge,
} from '@/modules/shared/ui';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <YStack gap={2}>
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText selectable variant="body">
        {value}
      </AppText>
    </YStack>
  );
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function httpStatus(error: unknown) {
  return (error as { status?: number } | null)?.status;
}

/** One member account (`GET /api/v1/admin/users/{id}`) with a confirmed suspend / reactivate action. */
export default function AdminUserDetailScreen({ userId }: { userId: string }) {
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => getAdminUser(userId),
    enabled: UUID_PATTERN.test(userId),
    retry: (count, err) => httpStatus(err) !== 404 && count < 2,
  });
  const { toggle, pendingId } = useUserStatusAction();
  const header = (
    <ScreenHeader back={{ fallback: '/admin/users' as Href }} title={user?.name ?? 'Member'} />
  );

  // `GET /admin/users/{id}` takes a UUID; an empty or malformed link can never load, and a 404 will not either.
  if (!UUID_PATTERN.test(userId) || httpStatus(error) === 404) {
    return (
      <Screen>
        {header}
        <EmptyState
          actionLabel="Back to users"
          body="This link does not point to a member account."
          iconName="user"
          onAction={() => router.replace('/admin/users' as Href)}
          title="Member not found"
        />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        {header}
        <SkeletonCard lines={4} />
      </Screen>
    );
  }
  if (isError || !user) {
    return (
      <Screen>
        {header}
        <ErrorState
          body={error instanceof Error ? error.message : 'This account could not be loaded.'}
          onRetry={() => void refetch()}
          title="Unable to load this member"
        />
      </Screen>
    );
  }

  const suspended = isSuspended(user.status);
  const joined = user.createdAt ? new Date(user.createdAt) : null;
  return (
    <Screen maxWidth="form" onRefresh={() => void refetch()} refreshing={isRefetching}>
      {header}
      <Card variant="elevated">
        <XStack alignItems="center" gap="$x3">
          <Avatar name={user.name === '—' ? user.email : user.name} size="lg" />
          <YStack flex={1} gap="$x1" minWidth={0}>
            <AppText numberOfLines={1} variant="bodyStrong">
              {user.name && user.name !== '—' ? user.name : 'No display name'}
            </AppText>
            <XStack flexWrap="wrap" gap="$x2">
              <StatusBadge label={memberRoleLabel(user.role)} tone="neutral" />
              <UserStatusBadge status={user.status} />
            </XStack>
          </YStack>
        </XStack>
      </Card>
      <Section title="Account">
        <Card>
          <YStack gap="$x3">
            <Field label="Email" value={user.email || 'Not set'} />
            <Field label="Joined" value={formatDate(joined) ?? 'Unknown'} />
            <Field label="User ID" value={user.id} />
          </YStack>
        </Card>
      </Section>
      <Section
        subtitle={
          suspended
            ? 'This member cannot sign in. Reactivating restores access immediately.'
            : 'Suspending signs the member out and blocks new sign-ins.'
        }
        title="Access"
      >
        <AppButton
          fullWidth
          icon={suspended ? 'check' : 'lock'}
          label={suspended ? 'Reactivate account' : 'Suspend account'}
          loading={pendingId === user.id}
          onPress={() => void toggle(user)}
          variant={suspended ? 'primary' : 'danger'}
        />
      </Section>
    </Screen>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { YStack } from 'tamagui';
import {
  getNotificationSettings,
  type NotificationPreferences,
  notificationKeys,
  updateNotificationSettings,
} from '@/modules/notifications/api';
import { PushSection } from '@/modules/notifications/components/PushSection';
import { QuietHoursSection } from '@/modules/notifications/components/QuietHoursSection';
import { SettingRow } from '@/modules/notifications/components/SettingRow';
import type { AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { Section } from '@/modules/shared/ui/Section';

/** Category toggles, in the order members think about them; keys match the backend settings. */
const CATEGORIES: { key: string; title: string; description: string; icon: AppIconName }[] = [
  { key: 'chatMessages', title: 'Messages', description: 'New chat messages', icon: 'message' },
  {
    key: 'rideAlerts',
    title: 'Rides',
    description: 'Seat requests and their answers',
    icon: 'car',
  },
  {
    key: 'housingAlerts',
    title: 'Rooms',
    description: 'Inquiries about your listings',
    icon: 'home',
  },
  {
    key: 'expenseAlerts',
    title: 'Shared expenses',
    description: 'Expenses added to your groups',
    icon: 'wallet',
  },
  {
    key: 'jobAlerts',
    title: 'Jobs',
    description: 'Applications and their status',
    icon: 'briefcase',
  },
  {
    key: 'referralAlerts',
    title: 'Referrals',
    description: 'Updates on referrals you are part of',
    icon: 'briefcase',
  },
  {
    key: 'communityEvents',
    title: 'Events',
    description: 'RSVPs to events you organise',
    icon: 'calendar',
  },
  {
    key: 'safetyAlerts',
    title: 'Safety',
    description: 'Safety and account notices',
    icon: 'shield',
  },
];

function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Notification settings. Each change is saved to the server at once; a failed save puts the switch back. */
export function NotificationSettingsScreen() {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: notificationKeys.settings,
    queryFn: getNotificationSettings,
  });

  const save = useMutation({
    mutationFn: updateNotificationSettings,
    onMutate: async (patch: NotificationPreferences) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.settings });
      const previous = queryClient.getQueryData<{ preferences: NotificationPreferences }>(
        notificationKeys.settings,
      );
      if (previous) {
        queryClient.setQueryData(notificationKeys.settings, {
          preferences: { ...previous.preferences, ...patch },
        });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(notificationKeys.settings, context.previous);
    },
    onSuccess: (saved) => queryClient.setQueryData(notificationKeys.settings, saved),
  });

  const header = (
    <ScreenHeader
      back={{ fallback: '/notifications' as Href }}
      subtitle="Choose what reaches you and when. Changes save automatically."
      title="Notification settings"
    />
  );
  if (settings.isLoading) {
    return (
      <Screen>
        {header}
        <LoadingState label="Loading notification settings..." />
      </Screen>
    );
  }
  if (settings.isError || !settings.data) {
    return (
      <Screen onRefresh={() => settings.refetch()} refreshing={settings.isRefetching}>
        {header}
        <ErrorState
          title="Unable to load your settings"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={() => settings.refetch()}
        />
      </Screen>
    );
  }

  const prefs = settings.data.preferences;
  const on = (key: string) => prefs[key] === true;
  const set = (patch: NotificationPreferences) => save.mutate(patch);
  const master = on('allNotifications');

  return (
    <Screen onRefresh={() => settings.refetch()} refreshing={settings.isRefetching}>
      <YStack gap="$x5">
        {header}

        {save.isError ? (
          <AppText role="alert" tone="danger" variant="caption">
            {save.error instanceof Error ? save.error.message : 'Could not save that change.'} Your
            previous setting was kept.
          </AppText>
        ) : null}

        <Card padding="$x4">
          <SettingRow
            description="Turn this off to pause everything except safety notices"
            icon="bell"
            onChange={(next) => set({ allNotifications: next })}
            title="All notifications"
            value={master}
          />
        </Card>

        <Section title="How we reach you">
          <Card padding="$x4">
            <YStack gap="$x1">
              <SettingRow
                description="Shown in your Notifications inbox"
                disabled={!master}
                icon="message"
                onChange={(next) => set({ inApp: next })}
                title="In the app"
                value={on('inApp')}
              />
              <PushSection
                disabled={!master}
                onChange={(next) => set({ push: next })}
                value={on('push')}
              />
            </YStack>
          </Card>
        </Section>

        <Section title="What to tell you about">
          <Card padding="$x4">
            <YStack gap="$x1">
              {CATEGORIES.map((category) => (
                <SettingRow
                  description={category.description}
                  disabled={!master && category.key !== 'safetyAlerts'}
                  icon={category.icon}
                  key={category.key}
                  onChange={(next) => set({ [category.key]: next })}
                  title={category.title}
                  value={on(category.key)}
                />
              ))}
            </YStack>
          </Card>
        </Section>

        <Section title="Quiet hours">
          <QuietHoursSection
            enabled={on('quietHours')}
            end={String(prefs.quietEnd ?? '07:00')}
            onSaveTimes={(quietStart, quietEnd) =>
              set({ quietStart, quietEnd, timeZone: deviceTimeZone() })
            }
            onToggle={(next) => set({ quietHours: next, timeZone: deviceTimeZone() })}
            saving={save.isPending}
            start={String(prefs.quietStart ?? '22:00')}
            timeZone={String(prefs.timeZone ?? deviceTimeZone())}
          />
        </Section>
      </YStack>
    </Screen>
  );
}

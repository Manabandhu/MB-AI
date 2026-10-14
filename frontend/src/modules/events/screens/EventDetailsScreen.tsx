import { formatDate, formatTimeRange } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { shareLink } from '@/lib/share';
import {
  getEvent,
  listEventAttendance,
  listEventCategories,
  type RsvpStatus,
  rsvpEvent,
} from '@/modules/events/api';
import { rsvpIs } from '@/modules/events/utils/eventTime';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { errorText, showError, showMessage } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
  { status: 'going', label: 'Going' },
  { status: 'interested', label: 'Interested' },
  { status: 'maybe', label: 'Maybe' },
];

function rsvpLabel(status?: string | null) {
  if (rsvpIs(status, 'going')) return "You're going";
  if (rsvpIs(status, 'interested')) return "You're interested";
  if (rsvpIs(status, 'maybe')) return 'You might go';
  if (rsvpIs(status, 'saved')) return 'Saved';
  return null;
}

/**
 * One event. Members RSVP (going, interested, maybe), change or cancel it, or just save the event. The organizer
 * sees who is coming instead; editing or cancelling an event has no backend endpoint yet.
 */
export default function EventDetailsScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId: string }>();
  const id = String(eventId ?? params.eventId ?? '');
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const signedIn = useAuthStore((s) => s.status === 'authenticated');
  const userId = useAuthStore((s) => s.user?.id);

  const eventQuery = useQuery({
    queryKey: ['events', id],
    queryFn: () => getEvent(id),
    enabled: Boolean(id),
  });
  const categoriesQuery = useQuery({
    queryKey: ['events', 'categories'],
    queryFn: listEventCategories,
    staleTime: 1000 * 60 * 10,
  });
  // Signed-in members see their own RSVP; the organizer sees every RSVP.
  const attendanceQuery = useQuery({
    queryKey: ['events', id, 'attendance'],
    queryFn: () => listEventAttendance(id),
    enabled: Boolean(id && signedIn),
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) => rsvpEvent(id, status),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', id, 'attendance'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'saved'] }),
      ]),
    onError: (error) => showError('Could not update your RSVP', error),
  });

  if (eventQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/events" />
        <LoadingState label="Loading event…" />
      </Screen>
    );
  }

  const event = eventQuery.data;
  if (eventQuery.isError || !event) {
    const notFound = (eventQuery.error as { status?: number } | null)?.status === 404;
    return (
      <Screen>
        <BackButton fallback="/events" />
        <ErrorState
          body={notFound ? 'This event was removed.' : errorText(eventQuery.error)}
          onRetry={notFound ? undefined : () => eventQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Event not found' : 'Could not load this event'}
        />
      </Screen>
    );
  }

  const isOrganizer = Boolean(userId && event.organizerId === userId);
  const attendance = attendanceQuery.data ?? [];
  const mine = attendance.find((a) => a.userId === userId);
  const myStatus = mine && !rsvpIs(mine.status, 'not_going') ? mine.status : null;
  const category = categoriesQuery.data?.find((c) => c.id === event.categoryId)?.name;
  const ended = event.endAt ? new Date(event.endAt).getTime() < Date.now() : false;
  const count = (status: string) => attendance.filter((a) => rsvpIs(a.status, status)).length;

  const requireSignIn = () => {
    if (signedIn) return true;
    router.push('/sign-in' as Href);
    return false;
  };

  const setRsvp = (status: RsvpStatus) => {
    if (!requireSignIn() || rsvpMutation.isPending) return;
    if (attendanceQuery.isError || attendanceQuery.isLoading) {
      showError('Your RSVP is not loaded', 'Retry loading it first.');
      return;
    }
    rsvpMutation.mutate(status);
  };

  const cancelRsvp = async () => {
    const ok = await confirm({
      title: 'Cancel your RSVP?',
      body: 'The organizer will no longer count you. You can RSVP again any time.',
      confirmLabel: 'Cancel RSVP',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (ok) rsvpMutation.mutate('not_going');
  };

  const onDirections = async () => {
    const query =
      event.latitude != null && event.longitude != null
        ? `${event.latitude},${event.longitude}`
        : event.location;
    try {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      );
    } catch (error) {
      showError('Could not open maps', error);
    }
  };

  const onShare = async () => {
    try {
      const result = await shareLink(`/events/${event.id}`, event.title);
      if (result === 'copied') showMessage('Link copied', 'The event link is on your clipboard.');
    } catch (error) {
      showError('Could not share this event', error);
    }
  };

  const showBar = !isOrganizer && !ended;
  const online = event.location?.trim().toLowerCase() === 'online';

  return (
    <YStack flex={1}>
      <Screen
        bottomInset={showBar ? ACTION_BAR_SPACE + 48 : 0}
        onRefresh={() => Promise.all([eventQuery.refetch(), attendanceQuery.refetch()])}
        refreshing={eventQuery.isRefetching}
      >
        <YStack gap="$x4">
          <ScreenHeader
            actions={<IconButton icon="share" label="Share event" onPress={onShare} />}
            back={{ fallback: '/events' as Href }}
            title="Event"
          />
          <Card gap="$x3">
            <XStack flexWrap="wrap" gap="$x2">
              {category ? <StatusBadge label={category} tone="primary" /> : null}
              {ended ? <StatusBadge label="Ended" /> : null}
              {isOrganizer ? <StatusBadge label="You're hosting" tone="success" /> : null}
              {!isOrganizer && myStatus ? (
                <StatusBadge label={rsvpLabel(myStatus) ?? myStatus} tone="success" />
              ) : null}
            </XStack>
            <Heading variant="h3">{event.title}</Heading>
            <YStack gap={2}>
              <AppText variant="bodyStrong">
                {formatDate(event.startAt, 'long') ?? 'Date to be announced'}
              </AppText>
              <AppText tone="muted">{formatTimeRange(event.startAt, event.endAt) ?? ''}</AppText>
            </YStack>
            <AppText>{event.location}</AppText>
            {online ? null : (
              <XStack flexWrap="wrap" gap="$x3">
                <AppButton
                  icon="map-pin"
                  label="Directions"
                  onPress={onDirections}
                  size="sm"
                  variant="secondary"
                />
                <AppButton
                  icon="car"
                  label="Find a carpool"
                  onPress={() =>
                    router.push(`/rides?to=${encodeURIComponent(event.location)}` as Href)
                  }
                  size="sm"
                  variant="ghost"
                />
              </XStack>
            )}
          </Card>

          <Card gap="$x2">
            <Heading variant="h4">About</Heading>
            <AppText selectable>
              {event.description || 'The host has not added a description yet.'}
            </AppText>
          </Card>

          {isOrganizer ? (
            <Card gap="$x2">
              <Heading variant="h4">RSVPs</Heading>
              {attendanceQuery.isLoading ? (
                <LoadingState label="Loading RSVPs…" />
              ) : attendanceQuery.isError ? (
                <ErrorState
                  body={errorText(attendanceQuery.error)}
                  compact
                  onRetry={() => attendanceQuery.refetch()}
                  retryLabel="Retry"
                  title="Could not load RSVPs"
                />
              ) : (
                <AppText>
                  {count('going')} going · {count('interested')} interested · {count('maybe')} maybe
                </AppText>
              )}
            </Card>
          ) : null}
        </YStack>
      </Screen>

      {showBar ? (
        <ActionBar
          label="RSVP"
          leading={
            attendanceQuery.isError ? (
              <AppButton
                icon="refresh"
                label="Couldn't load your RSVP. Retry"
                onPress={() => attendanceQuery.refetch()}
                size="sm"
                variant="ghost"
              />
            ) : (
              <AppText tone="muted" variant="caption">
                {!signedIn
                  ? 'Sign in to RSVP'
                  : attendanceQuery.isLoading
                    ? 'Loading your RSVP…'
                    : (rsvpLabel(myStatus) ?? 'Not responded yet')}
              </AppText>
            )
          }
        >
          <FilterChipRow label="Your RSVP" role="radiogroup">
            {RSVP_OPTIONS.map((option) => (
              <Chip
                disabled={rsvpMutation.isPending}
                key={option.status}
                label={option.label}
                onPress={() => setRsvp(option.status)}
                radio
                selected={rsvpIs(myStatus, option.status)}
              />
            ))}
          </FilterChipRow>
          {myStatus && !rsvpIs(myStatus, 'saved') ? (
            <AppButton
              disabled={rsvpMutation.isPending}
              label="Cancel RSVP"
              onPress={cancelRsvp}
              size="sm"
              variant="ghost"
            />
          ) : (
            <AppButton
              disabled={rsvpMutation.isPending}
              icon="bookmark"
              label={rsvpIs(myStatus, 'saved') ? 'Unsave' : 'Save'}
              onPress={() => setRsvp(rsvpIs(myStatus, 'saved') ? 'not_going' : 'saved')}
              size="sm"
              variant="ghost"
            />
          )}
        </ActionBar>
      ) : null}
    </YStack>
  );
}

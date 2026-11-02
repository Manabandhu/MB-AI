import { useMutation, useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getRide, listParticipants, submitRideRating } from '@/modules/rides/api';
import { formatDeparture } from '@/modules/rides/components/RideCard';
import {
  errorMessage,
  isNotFound,
  memberLabel,
  statusIs,
  statusLabel,
} from '@/modules/rides/utils/rideFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText, Heading } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { RatingInput } from '@/modules/shared/ui/RatingInput';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

/**
 * One 1–5 rating per person per ride, only after the ride is completed. A passenger rates the driver (no
 * `rateeId`); the driver picks which rider to rate from the participants list.
 */
export function RideRateScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [rateeId, setRateeId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const rideQuery = useQuery({
    queryKey: ['rides', 'detail', rideId],
    queryFn: () => getRide(rideId),
    enabled: Boolean(rideId) && isAuthenticated,
  });
  const ride = rideQuery.data;
  const participantsQuery = useQuery({
    queryKey: ['rides', 'participants', rideId],
    queryFn: () => listParticipants(rideId),
    enabled: Boolean(ride?.isDriver),
  });
  const riders = (participantsQuery.data ?? []).filter(
    (p) => statusIs(p.role, 'rider') && p.userId !== userId,
  );

  const mutation = useMutation({
    mutationFn: () =>
      submitRideRating(rideId, {
        rateeId: ride?.isDriver ? (rateeId ?? undefined) : undefined,
        rating: score,
        comment,
      }),
    onSuccess: () => setDone(true),
    onError: (e) => setFormError(errorMessage(e)),
  });

  const submit = () => {
    setFormError(null);
    if (ride?.isDriver && !rateeId) {
      setFormError('Choose the rider you want to rate.');
      return;
    }
    if (score < 1) {
      setFormError('Choose a rating from 1 to 5 stars.');
      return;
    }
    mutation.mutate();
  };

  const content = () => {
    if (!isAuthenticated || rideQuery.isLoading) {
      return <LoadingState label="Loading ride…" />;
    }
    if (rideQuery.isError || !ride) {
      return isNotFound(rideQuery.error) ? (
        <ErrorState body="This ride no longer exists." title="Ride not found" />
      ) : (
        <ErrorState
          body={errorMessage(rideQuery.error)}
          onRetry={() => rideQuery.refetch()}
          retryLabel="Retry"
          title="Could not load this ride"
        />
      );
    }
    if (done) {
      return (
        <Card aria-live="polite" gap="$x3" variant="tinted">
          <Heading variant="h3">Rating sent</Heading>
          <AppText tone="muted">
            Thank you. Ratings help riders and drivers choose who to travel with.
          </AppText>
          <XStack flexWrap="wrap" gap="$x2">
            {ride.isDriver && riders.length > 1 ? (
              <AppButton
                label="Rate another rider"
                onPress={() => {
                  setDone(false);
                  setScore(0);
                  setComment('');
                  setRateeId(null);
                }}
                variant="secondary"
              />
            ) : null}
            <AppButton
              label="Ride history"
              onPress={() => router.replace('/rides/history' as Href)}
            />
          </XStack>
        </Card>
      );
    }
    if (!statusIs(ride.status, 'completed')) {
      return (
        <Card gap="$x2" variant="tinted">
          <AppText variant="bodyStrong">Ratings open when the ride is completed</AppText>
          <AppText tone="muted">
            This ride is {statusLabel(ride.status).toLowerCase()}. The driver marks it completed on
            arrival; then you can rate {ride.isDriver ? 'your riders' : 'the driver'}.
          </AppText>
        </Card>
      );
    }
    return (
      <YStack gap="$x4">
        {ride.isDriver ? (
          <YStack gap="$x2">
            <AppText variant="label">Rider</AppText>
            {participantsQuery.isLoading ? (
              <LoadingState label="Loading riders…" />
            ) : participantsQuery.isError ? (
              <ErrorState
                body={errorMessage(participantsQuery.error)}
                compact
                onRetry={() => participantsQuery.refetch()}
                retryLabel="Retry"
                title="Could not load riders"
              />
            ) : riders.length === 0 ? (
              <AppText tone="muted">
                Nobody rode with you on this trip, so there is no one to rate.
              </AppText>
            ) : (
              <XStack aria-label="Rider to rate" flexWrap="wrap" gap="$x2" role="radiogroup">
                {riders.map((r) => (
                  <Chip
                    key={r.userId}
                    label={memberLabel(r.userId, 'rider')}
                    onPress={() => setRateeId(r.userId)}
                    radio
                    selected={rateeId === r.userId}
                  />
                ))}
              </XStack>
            )}
          </YStack>
        ) : (
          <AppText tone="muted">You are rating the driver of this ride.</AppText>
        )}

        <YStack gap="$x2">
          <AppText variant="label">Rating</AppText>
          <RatingInput onChange={setScore} value={score} />
        </YStack>

        <TextField
          label="Comment (optional)"
          maxLength={4000}
          multiline
          onChangeText={setComment}
          placeholder="What went well, or what could be better?"
          value={comment}
        />

        {formError ? (
          <AppText aria-live="polite" tone="danger">
            {formError}
          </AppText>
        ) : null}

        <XStack flexWrap="wrap" gap="$x2">
          <AppButton
            disabled={ride.isDriver && riders.length === 0}
            label="Send rating"
            loading={mutation.isPending}
            onPress={submit}
          />
          <AppButton label="Cancel" onPress={() => router.back()} variant="ghost" />
        </XStack>
      </YStack>
    );
  };

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <ScreenHeader
        back={{ fallback: '/rides/history' as Href }}
        subtitle={ride ? `${ride.routeLabel} · ${formatDeparture(ride.departureAt)}` : null}
        title="Rate ride"
      />
      {content()}
    </Screen>
  );
}

import { useMutation, useQuery } from '@tanstack/react-query';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import { getRide, listParticipants, submitRideRating } from '@/modules/rides/api';
import { ChoiceChip } from '@/modules/rides/components/ChoiceChip';
import { formatDeparture } from '@/modules/rides/components/RideListCard';
import {
  errorMessage,
  isNotFound,
  memberLabel,
  statusIs,
  statusLabel,
} from '@/modules/rides/utils/rideFormat';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';

const SCORE_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * One 1–5 rating per person per ride, only after the ride is completed. A passenger rates the driver (no
 * `rateeId`); the driver picks which rider to rate from the participants list.
 */
export function RideRateScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const theme = useTheme();
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
          <AppText variant="h3">Rating sent</AppText>
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
                  <ChoiceChip
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
          <XStack aria-label="Rating" gap="$x1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <YStack
                alignItems="center"
                aria-checked={score === n}
                aria-label={`${n} ${n === 1 ? 'star' : 'stars'}, ${SCORE_WORDS[n]}`}
                cursor="pointer"
                focusable
                height="$touch"
                justifyContent="center"
                key={n}
                onPress={() => setScore(n)}
                pressStyle={{ opacity: 0.7 }}
                role="radio"
                width="$touch"
              >
                <AppIcon
                  color={n <= score ? theme.warm?.val : theme.colorMuted?.val}
                  name="star"
                  size={28}
                />
              </YStack>
            ))}
          </XStack>
          <AppText tone="muted" variant="caption">
            {score ? SCORE_WORDS[score] : 'Tap a star'}
          </AppText>
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Screen>
        <YStack gap="$x4">
          <BackButton fallback="/rides/history" />
          <YStack gap="$x1">
            <AppText role="heading" variant="h2">
              Rate ride
            </AppText>
            {ride ? (
              <AppText tone="muted" variant="caption">
                {ride.routeLabel} · {formatDeparture(ride.departureAt)}
              </AppText>
            ) : null}
          </YStack>
          {content()}
        </YStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

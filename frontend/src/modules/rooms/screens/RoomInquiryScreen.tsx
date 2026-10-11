import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { getRoomDetail, inquireRoom } from '@/modules/rooms/api';
import { type RoomInquiryInput, statusIs } from '@/modules/rooms/types';
import { formatRent } from '@/modules/rooms/utils/roomFormat';
import {
  errorMessage,
  isNotFound,
  localIsoDate,
  moveInDateError,
} from '@/modules/rooms/utils/roomLabels';
import { EmptyState } from '@/modules/shared/components/EmptyState';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { DateTimeField } from '@/modules/shared/ui/DateTimeField';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';

/** `null` is "flexible" and is sent as `stayDurationMonths: null`. */
const DURATION_OPTIONS: { label: string; value: number | null }[] = [
  { label: '3 months', value: 3 },
  { label: '6 months', value: 6 },
  { label: '12 months', value: 12 },
  { label: 'Flexible', value: null },
];

const DIETARY_OPTIONS = ['Pure veg', 'Vegetarian friendly', 'Non-veg', 'No preference'];

/** Sends an inquiry (creates or reuses the chat with the host) and opens that conversation. */
export function RoomInquiryScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [moveIn, setMoveIn] = useState<Date>(() => new Date());
  const moveInDate = localIsoDate(moveIn);
  const [durationMonths, setDurationMonths] = useState<number | null>(6);
  const [dietary, setDietary] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roomQuery = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
  });

  const mutation = useMutation({
    mutationFn: (input: RoomInquiryInput) => inquireRoom(roomId, input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      router.replace(`/chat/${res.conversationId}` as Href);
    },
    onError: (error) => setSubmitError(errorMessage(error, 'Could not send your inquiry.')),
  });

  const dateError = moveInDateError(moveInDate);

  if (roomQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback={`/rooms/${roomId}`} />
        <LoadingState label="Loading listing…" />
      </Screen>
    );
  }

  if (roomQuery.isError || !roomQuery.data) {
    const notFound = isNotFound(roomQuery.error);
    return (
      <Screen>
        <BackButton fallback={`/rooms/${roomId}`} />
        <ErrorState
          body={
            notFound
              ? 'This listing was removed or is no longer available.'
              : errorMessage(roomQuery.error)
          }
          onRetry={notFound ? undefined : () => roomQuery.refetch()}
          retryLabel="Retry"
          title={notFound ? 'Room not found' : 'Could not load listing'}
        />
      </Screen>
    );
  }

  const room = roomQuery.data;
  const acceptingInquiries = statusIs(room.status, 'active');

  const handleSubmit = () => {
    const dateProblem = moveInDateError(moveInDate);
    const msgProblem = message.trim() ? null : 'Write a short introduction for the host.';
    setMessageError(msgProblem);
    if (dateProblem || msgProblem) return;
    setSubmitError(null);
    mutation.mutate({
      moveInDate,
      stayDurationMonths: durationMonths,
      dietaryLifestyle: dietary ?? undefined,
      introMessage: message.trim(),
    });
  };

  return (
    <Screen keyboardAvoiding maxWidth="form">
      <YStack gap="$x4">
        <ScreenHeader back={{ fallback: `/rooms/${roomId}` as Href }} title="Contact the host" />

        <Card gap="$x1" variant="filled">
          <AppText numberOfLines={2} variant="bodyStrong">
            {room.title}
          </AppText>
          <AppText tone="primary" variant="label">
            {formatRent(room.price)}
            {room.broadLocation ? ` · ${room.broadLocation}` : ''}
          </AppText>
        </Card>

        {!acceptingInquiries ? (
          <EmptyState
            actionLabel="Browse other rooms"
            body="The host paused or closed this listing, so it cannot take inquiries right now."
            iconName="bed"
            onAction={() => router.replace('/rooms' as Href)}
            title="Not accepting inquiries"
          />
        ) : (
          <>
            {submitError ? (
              <Card aria-live="polite" borderColor="$error" variant="outlined">
                <XStack alignItems="center" gap="$x2">
                  <AppIcon name="warning" size={18} />
                  <AppText flex={1} tone="danger" variant="label">
                    {submitError}
                  </AppText>
                </XStack>
              </Card>
            ) : null}

            <DateTimeField
              error={dateError}
              helper="Today or later"
              label="Target move-in date"
              minimumDate={new Date()}
              mode="date"
              onChange={setMoveIn}
              value={moveIn}
            />

            <YStack gap="$x2">
              <AppText variant="label">Expected stay</AppText>
              <XStack aria-label="Expected stay" flexWrap="wrap" gap="$x2" role="radiogroup">
                {DURATION_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.label}
                    label={opt.label}
                    onPress={() => setDurationMonths(opt.value)}
                    radio
                    selected={durationMonths === opt.value}
                  />
                ))}
              </XStack>
            </YStack>

            <YStack gap="$x2">
              <AppText variant="label">Your diet (optional)</AppText>
              <XStack aria-label="Your diet" flexWrap="wrap" gap="$x2" role="radiogroup">
                {DIETARY_OPTIONS.map((opt) => (
                  <Chip
                    key={opt}
                    label={opt}
                    onPress={() => setDietary(dietary === opt ? null : opt)}
                    radio
                    selected={dietary === opt}
                  />
                ))}
              </XStack>
            </YStack>

            <TextField
              error={messageError}
              label="Introduction and questions"
              maxLength={4000}
              multiline
              onChangeText={(text) => {
                setMessage(text);
                if (messageError && text.trim()) setMessageError(null);
              }}
              placeholder="Hi! I'm interested in this room. A bit about me…"
              value={message}
            />

            <XStack alignItems="center" gap="$x2">
              <AppIcon name="message" size={18} />
              <AppText flex={1} tone="muted" variant="caption">
                Sending opens a chat with the host. If you already asked about this room, you return
                to the same chat.
              </AppText>
            </XStack>

            <AppButton
              fullWidth
              label="Send inquiry and open chat"
              loading={mutation.isPending}
              onPress={handleSubmit}
            />
          </>
        )}
      </YStack>
    </Screen>
  );
}

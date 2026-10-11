import { formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { getRoomDetail, inquireRoom } from '@/modules/rooms/api';
import { type RoomInquiryInput, statusIs } from '@/modules/rooms/types';
import {
  errorMessage,
  isNotFound,
  localIsoDate,
  moveInDateError,
} from '@/modules/rooms/utils/roomLabels';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { Screen } from '@/modules/shared/ui/Screen';
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

  const [moveInDate, setMoveInDate] = useState(localIsoDate());
  const [dateTouched, setDateTouched] = useState(false);
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

  const dateError = dateTouched ? moveInDateError(moveInDate) : null;

  if (roomQuery.isLoading) {
    return (
      <Screen>
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
    setDateTouched(true);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <Screen>
        <YStack gap="$x4">
          <BackButton fallback={`/rooms/${roomId}`} />
          <AppText role="heading" variant="h2">
            Contact the host
          </AppText>

          <Card gap="$x1" variant="filled">
            <AppText numberOfLines={2} variant="bodyStrong">
              {room.title}
            </AppText>
            <AppText tone="primary" variant="label">
              {formatMoney(room.price, 'USD')}/mo
              {room.broadLocation ? ` · ${room.broadLocation}` : ''}
            </AppText>
          </Card>

          {!acceptingInquiries ? (
            <Card variant="outlined">
              <AppText tone="danger" variant="label">
                This listing is not accepting inquiries right now.
              </AppText>
            </Card>
          ) : null}

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

          <TextField
            autoCapitalize="none"
            error={dateError}
            helper="YYYY-MM-DD, today or later"
            keyboardType="numbers-and-punctuation"
            label="Target move-in date"
            maxLength={10}
            onBlur={() => setDateTouched(true)}
            onChangeText={setMoveInDate}
            placeholder="YYYY-MM-DD"
            value={moveInDate}
          />

          <YStack gap="$x2">
            <AppText variant="label">Expected stay</AppText>
            <XStack flexWrap="wrap" gap="$x2">
              {DURATION_OPTIONS.map((opt) => (
                <Chip
                  key={opt.label}
                  label={opt.label}
                  onPress={() => setDurationMonths(opt.value)}
                  selected={durationMonths === opt.value}
                />
              ))}
            </XStack>
          </YStack>

          <YStack gap="$x2">
            <AppText variant="label">Your diet (optional)</AppText>
            <XStack flexWrap="wrap" gap="$x2">
              {DIETARY_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  onPress={() => setDietary(dietary === opt ? null : opt)}
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
            disabled={!acceptingInquiries}
            fullWidth
            label="Send inquiry and open chat"
            loading={mutation.isPending}
            onPress={handleSubmit}
          />
        </YStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

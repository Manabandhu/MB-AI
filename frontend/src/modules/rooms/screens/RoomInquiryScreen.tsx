import { color as colors, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBooking, getRoomDetail } from '@/modules/rooms/api';
import type { CreateBookingInput } from '@/modules/rooms/types';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';

export function RoomInquiryScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
  });

  const mutation = useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(roomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'my-bookings'] });
      setSuccess(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load listing"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Message sent</Text>
          <Text style={styles.subtitle}>
            Your inquiry was sent to the host. They will respond here.
          </Text>
          <AppButton label="Back to listing" onPress={() => router.replace(`/rooms/${roomId}`)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Inquiry</Text>
          <Text style={styles.title}>Contact about {data.title}</Text>
          <Text style={styles.subtitle}>
            Send a message to the host. Your exact contact details are only shared once the host
            responds.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextArea
            value={message}
            onChangeText={setMessage}
            label="Your message"
            placeholder="Introduce yourself, move-in timeline, and any questions."
            maxLength={4000}
          />

          <View style={styles.actions}>
            <AppButton
              label="Send inquiry"
              onPress={() => mutation.mutate({ message })}
              disabled={message.trim().length === 0}
              loading={mutation.isPending}
            />
            <AppButton label="Cancel" onPress={() => router.back()} variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { backgroundColor: colors.background, flexGrow: 1, padding: space.x4 },
  container: { alignSelf: 'center', gap: space.x5, maxWidth: 640, width: '100%' },
  eyebrow: { color: colors.teal, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted },
  errorBox: { backgroundColor: colors.error, borderRadius: 12, padding: space.x4 },
  errorText: { color: colors.surface, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
});

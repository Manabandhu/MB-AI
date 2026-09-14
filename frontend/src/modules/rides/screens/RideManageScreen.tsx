import { color as colors, radius, space, typography } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getRideForOwner,
  provisionRideChat,
  reactivateRideOffer,
  updateRideOffer,
  updateRideStatus,
} from '@/modules/rides/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { Input, InputField } from '@/modules/shared/ui/gluestack/input';

export function RideManageScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [seats, setSeats] = useState('');
  const [contribution, setContribution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rides', 'owner', rideId],
    queryFn: () => getRideForOwner(rideId),
    enabled: Boolean(rideId),
  });

  const mutation = useMutation({
    mutationFn: (input: { seatsAvailable?: number; contribution?: number }) =>
      updateRideOffer(rideId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'owner', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      setSuccess(true);
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit() {
    setError(null);
    const input: { seatsAvailable?: number; contribution?: number } = {};
    if (seats.trim()) input.seatsAvailable = parseInt(seats, 10);
    if (contribution.trim()) input.contribution = parseFloat(contribution);
    if (Object.keys(input).length === 0) {
      setError('Enter at least one field to update.');
      return;
    }
    mutation.mutate(input);
  }

  // Lifecycle action: Start trip
  async function handleStartTrip() {
    try {
      setActionLoading('start');
      await updateRideStatus(rideId, 'IN_PROGRESS');
      queryClient.invalidateQueries({ queryKey: ['rides', 'owner', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      Alert.alert('Trip Started', 'Ride status is now IN_PROGRESS. Passengers have been notified.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to start trip.');
    } finally {
      setActionLoading(null);
    }
  }

  // Lifecycle action: Mark completed (triggers 2-hour chat purge countdown)
  function handleMarkCompleted() {
    Alert.alert(
      'Complete Trip (Arrived)?',
      'This will mark the ride as COMPLETED and remove it from active search feeds. The temporary coordination chat will automatically self-delete 2 hours from now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Arrival',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('complete');
              await updateRideStatus(rideId, 'COMPLETED');
              queryClient.invalidateQueries({ queryKey: ['rides', 'owner', rideId] });
              queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
              Alert.alert(
                'Ride Completed 🎉',
                'Ride is marked COMPLETED. Ephemeral chat will self-delete in 2 hours.',
              );
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to complete trip.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }

  // 1-Click action: Repeat this trip tomorrow
  async function handleRepeatTrip() {
    try {
      setActionLoading('repeat');
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const cloned = await reactivateRideOffer(rideId, tomorrow);
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] });
      Alert.alert('Ride Re-activated! 🚗', 'Trip cloned and scheduled for tomorrow.', [
        { text: 'Go to My Rides', onPress: () => router.push('/rides/mine') },
        { text: 'View New Offer', onPress: () => router.push(`/rides/${cloned.id}`) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to clone ride.');
    } finally {
      setActionLoading(null);
    }
  }

  // Open Ephemeral Chat
  async function handleOpenChat() {
    try {
      setActionLoading('chat');
      const res = await provisionRideChat(rideId);
      if (res.conversationId) {
        router.push(`/chat/${res.conversationId}`);
      } else {
        router.push('/chat');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to open coordination chat.');
    } finally {
      setActionLoading(null);
    }
  }

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
          title="Unable to load ride"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const isCompleted = data.status === 'COMPLETED';
  const isInProgress = data.status === 'IN_PROGRESS';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>Driver Control Panel</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Manage Ride</Text>
            <View
              style={[
                styles.statusBadge,
                isCompleted
                  ? styles.statusBadgeCompleted
                  : isInProgress
                    ? styles.statusBadgeInProgress
                    : styles.statusBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isCompleted
                    ? styles.statusTextCompleted
                    : isInProgress
                      ? styles.statusTextInProgress
                      : styles.statusTextActive,
                ]}
              >
                {data.status || 'ACTIVE'}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{data.title}</Text>

          {/* 1. Trip Lifecycle Controls */}
          <View style={styles.lifecycleCard}>
            <Text style={styles.cardHeaderTitle}>Live Trip Actions</Text>
            <Text style={styles.cardHeaderDesc}>
              Update status along your journey to keep passengers informed.
            </Text>

            <View style={styles.lifecycleActions}>
              {!isCompleted && !isInProgress && (
                <Pressable
                  style={styles.startTripBtn}
                  disabled={actionLoading !== null}
                  onPress={handleStartTrip}
                >
                  {actionLoading === 'start' ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <AppIcon name="car" size={16} color="#ffffff" />
                      <Text style={styles.startTripBtnText}>Start Trip (In Progress)</Text>
                    </>
                  )}
                </Pressable>
              )}

              {isInProgress && (
                <Pressable
                  style={styles.completeTripBtn}
                  disabled={actionLoading !== null}
                  onPress={handleMarkCompleted}
                >
                  {actionLoading === 'complete' ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <AppIcon name="check" size={16} color="#ffffff" />
                      <Text style={styles.completeTripBtnText}>Mark Completed (Arrived)</Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* 1-Click Repeat Trip Tomorrow */}
              <Pressable
                style={styles.repeatTripBtn}
                disabled={actionLoading !== null}
                onPress={handleRepeatTrip}
              >
                {actionLoading === 'repeat' ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <AppIcon name="sparks" size={16} color={colors.primary} />
                    <Text style={styles.repeatTripBtnText}>
                      Repeat This Trip Tomorrow (1-Click)
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Open Coordination Chat */}
              <Pressable
                style={styles.chatActionBtn}
                disabled={actionLoading !== null}
                onPress={handleOpenChat}
              >
                {actionLoading === 'chat' ? (
                  <ActivityIndicator color={colors.teal} size="small" />
                ) : (
                  <>
                    <AppIcon name="message" size={16} color={colors.teal} />
                    <Text style={styles.chatActionBtnText}>Open Coordination Chat</Text>
                  </>
                )}
              </Pressable>
            </View>

            {isCompleted && (
              <View style={styles.ephemeralNoticeBox}>
                <AppIcon name="shield" size={16} color={colors.teal} />
                <Text style={styles.ephemeralNoticeText}>
                  🔒 Trip is COMPLETED. The temporary group chat is active and scheduled to
                  permanently self-delete 2 hours after arrival.
                </Text>
              </View>
            )}
          </View>

          {success ? <Text style={styles.successText}>Ride settings updated</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* 2. Seat & Contribution Editing */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seats Available</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder={`Current: ${data.seatsAvailable}`}
                  keyboardType="number-pad"
                  value={seats}
                  onChangeText={setSeats}
                />
              </Input>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contribution ($)</Text>
              <Input className="min-h-14 rounded-xl bg-secondary/70">
                <InputField
                  placeholder={data.contribution ? `$${data.contribution}` : 'Optional'}
                  keyboardType="decimal-pad"
                  value={contribution}
                  onChangeText={setContribution}
                />
              </Input>
            </View>
            <View style={styles.actions}>
              <AppButton label="Save changes" onPress={handleSubmit} loading={mutation.isPending} />
              <AppButton
                label="View details"
                onPress={() => router.push(`/rides/${rideId}`)}
                variant="secondary"
              />
              <AppButton
                label="Participants"
                route={`/rides/${rideId}/participants`}
                variant="secondary"
              />
            </View>
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
  eyebrow: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusBadgeActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  statusBadgeInProgress: { backgroundColor: 'rgba(255,126,51,0.12)' },
  statusBadgeCompleted: { backgroundColor: 'rgba(107,114,128,0.12)' },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  statusTextActive: { color: '#059669' },
  statusTextInProgress: { color: colors.warm },
  statusTextCompleted: { color: colors.muted },

  lifecycleCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.card,
    padding: space.x4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: space.x3,
  },
  cardHeaderTitle: { ...typography.h4, color: colors.ink, fontWeight: '800' },
  cardHeaderDesc: { ...typography.caption, color: colors.muted },
  lifecycleActions: { gap: space.x2, marginTop: space.x1 },

  startTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
    backgroundColor: colors.primary,
    paddingVertical: space.x3,
    borderRadius: radius.control,
  },
  startTripBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },

  completeTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
    backgroundColor: '#059669',
    paddingVertical: space.x3,
    borderRadius: radius.control,
  },
  completeTripBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },

  repeatTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
    backgroundColor: 'rgba(67,30,190,0.08)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: space.x3,
    borderRadius: radius.control,
  },
  repeatTripBtnText: { color: colors.primary, fontWeight: '800', fontSize: 14 },

  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x2,
    backgroundColor: 'rgba(0,105,107,0.08)',
    borderWidth: 1,
    borderColor: colors.teal,
    paddingVertical: space.x3,
    borderRadius: radius.control,
  },
  chatActionBtnText: { color: colors.teal, fontWeight: '800', fontSize: 14 },

  ephemeralNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x2,
    backgroundColor: '#f0faf8',
    padding: space.x3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(0,105,107,0.15)',
    marginTop: space.x2,
  },
  ephemeralNoticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600',
    lineHeight: 16,
  },

  form: { gap: space.x4 },
  inputGroup: { gap: space.x2 },
  inputLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.x3, paddingTop: space.x2 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  successText: { color: colors.success, fontSize: 14, fontWeight: '700' },
});

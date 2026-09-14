import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRoomDetail, inquireRoom } from '@/modules/rooms/api';
import type { RoomInquiryInput } from '@/modules/rooms/types';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  ink: '#131b2e',
  background: '#faf8ff',
  surface: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  border: '#e2e8f0',
  muted: '#625f6e',
  danger: '#ba1a1a',
  dangerSoft: '#ffdad6',
};

const DURATION_OPTIONS = [
  { label: '3 Months', value: 3 },
  { label: '6 Months', value: 6 },
  { label: '12 Months', value: 12 },
  { label: 'Flexible', value: 1 },
];

const DIETARY_OPTIONS = [
  '🥦 Pure Veg Only',
  '🍳 Veg Friendly',
  '🍗 Non-Veg OK',
  '🌱 Any Lifestyle',
];

export function RoomInquiryScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const today = new Date().toISOString().split('T')[0];
  const [moveInDate, setMoveInDate] = useState(today);
  const [durationMonths, setDurationMonths] = useState(6);
  const [dietary, setDietary] = useState('🍳 Veg Friendly');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
  });

  const mutation = useMutation({
    mutationFn: (input: RoomInquiryInput) => inquireRoom(roomId, input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      // Direct Handshake: Immediately navigate to /chat/[conversationId]
      if (res.conversationId) {
        router.replace(`/chat/${res.conversationId}` as Href);
      } else {
        router.replace('/chat' as Href);
      }
    },
    onError: (err: Error) => setError(err.message || 'Failed to send inquiry'),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <LoadingState label="Loading listing..." />
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={s.safeArea}>
        <ErrorState
          title="Unable to load listing"
          body="Please check your connection and try again."
          retryLabel="Retry"
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const handleSubmit = () => {
    if (!message.trim()) {
      setError('Please enter a brief introductory message.');
      return;
    }
    setError(null);
    mutation.mutate({
      moveInDate,
      stayDurationMonths: durationMonths,
      dietaryLifestyle: dietary,
      introMessage: message.trim(),
    });
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: Math.max(insets.top > 0 ? 8 : space.x3, space.x3) }]}>
          <Pressable
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityLabel="Back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppIcon color={colors.ink} name="chevron-left" size={20} />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            Contact Host & Start Chat
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Listing Summary Card */}
          <View style={s.summaryCard}>
            <View style={s.summaryBadge}>
              <Text style={s.summaryBadgeText}>Room Inquiry</Text>
            </View>
            <Text style={s.summaryTitle}>{data.title}</Text>
            <View style={s.summaryMetaRow}>
              <Text style={s.summaryPrice}>${data.price}/month</Text>
              <Text style={s.summaryLocation}>• {data.broadLocation}</Text>
            </View>
          </View>

          {error && (
            <View style={s.errorBanner}>
              <AppIcon color={colors.danger} name="warning" size={18} />
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Move-In Date */}
          <View style={s.card}>
            <Text style={s.inputLabel}>Target Move-In Date</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={s.input}
              value={moveInDate}
              onChangeText={setMoveInDate}
            />

            {/* Stay Duration */}
            <Text style={s.inputLabel}>Expected Stay Duration</Text>
            <View style={s.chipsRow}>
              {DURATION_OPTIONS.map((opt) => {
                const selected = durationMonths === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setDurationMonths(opt.value)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Dietary Lifestyle */}
            <Text style={s.inputLabel}>Your Dietary Lifestyle</Text>
            <View style={s.chipsRow}>
              {DIETARY_OPTIONS.map((opt) => {
                const selected = dietary === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setDietary(opt)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Message */}
            <Text style={s.inputLabel}>Introductory Note & Questions *</Text>
            <TextArea
              value={message}
              onChangeText={setMessage}
              placeholder="Hi, I'm interested in this room. I work nearby / study at UT and am looking for a quiet, clean flatmate..."
              maxLength={4000}
            />
          </View>

          <View style={s.handshakeNotice}>
            <AppIcon color={colors.teal} name="message" size={18} />
            <Text style={s.handshakeNoticeText}>
              Submitting will instantly create a conversation with the host and take you directly to
              your chat!
            </Text>
          </View>

          <AppButton
            label={mutation.isPending ? 'Connecting...' : 'Send Inquiry & Start Chat'}
            onPress={handleSubmit}
            loading={mutation.isPending}
            variant="primary"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  content: {
    padding: space.x4,
    gap: space.x4,
    paddingBottom: 80,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.x4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  summaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  summaryBadgeText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '800',
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryPrice: {
    color: colors.appPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  summaryLocation: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: space.x4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.x3,
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  chipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#fff',
  },
  handshakeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.tealSoft,
    padding: 12,
    borderRadius: 14,
  },
  handshakeNoticeText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});

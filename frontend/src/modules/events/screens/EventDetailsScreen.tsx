import { formatDate, formatTimeRange } from '@manabandhu/core';
import { color as baseColors, radius } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import {
  getEvent,
  listEventAttendance,
  listEventCategories,
  rsvpEvent,
} from '@/modules/events/api';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  canvas: '#ffffff',
  canvasMuted: '#f8f9fe',
  accentBrand: '#431ebe',
  warm: '#ff7e33',
  inkSecondary: baseColors.muted,
  borderSubtle: '#e2e8f0',
  danger: '#ef4444',
};

const sp = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

interface EventDetailsScreenProps {
  eventId?: string;
}

export default function EventDetailsScreen({ eventId }: EventDetailsScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId: string }>();
  const resolvedEventId = eventId ?? params.eventId;
  const { session, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['events', resolvedEventId],
    queryFn: () => getEvent(resolvedEventId as string),
    enabled: !!resolvedEventId,
  });

  const { data: categories } = useQuery({
    queryKey: ['events', 'categories'],
    queryFn: listEventCategories,
    staleTime: 1000 * 60 * 10,
  });

  // Signed-in members see their own RSVP; the organizer sees every RSVP.
  const { data: attendance } = useQuery({
    queryKey: ['events', resolvedEventId, 'attendance'],
    queryFn: () => listEventAttendance(resolvedEventId as string),
    enabled: Boolean(resolvedEventId && session),
  });

  const rsvpMutation = useMutation({
    mutationFn: () => rsvpEvent(resolvedEventId as string, 'GOING'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['events', resolvedEventId, 'attendance'] }),
    onError: (err: Error) => setRsvpError(err.message),
  });

  if (isLoading) {
    return (
      <View style={s.centerContainer}>
        <Text style={s.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View style={s.centerContainer}>
        <Text style={s.errorEmoji}>⚠️</Text>
        <Text style={s.errorTitle}>Event Not Found</Text>
        <Text style={s.errorSubtitle}>
          This event might have concluded or the link has expired.
        </Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Back to Events</Text>
        </Pressable>
      </View>
    );
  }

  const isOrganizer = Boolean(user?.id && event.organizerId === user.id);
  const myRsvp = attendance?.find((a) => a.userId === user?.id);
  const goingCount = attendance?.filter((a) => a.status?.toUpperCase() === 'GOING').length;
  const category = categories?.find((c) => c.id === event.categoryId)?.name;

  const handleRsvp = () => {
    if (!session) {
      router.push('/sign-in' as Href);
      return;
    }
    setRsvpError(null);
    rsvpMutation.mutate();
  };

  const handleDirections = async () => {
    const query =
      event.latitude != null && event.longitude != null
        ? `${event.latitude},${event.longitude}`
        : event.location;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open maps', event.location);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event.title} — ${formatDate(event.startAt, 'long') ?? 'Date not set'} at ${event.location}`,
      });
    } catch (err) {
      Alert.alert('Unable to share', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <View style={s.container}>
      {/* Top App Bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.iconButton} accessibilityLabel="Back">
          <AppIcon name="chevron-left" size={20} color={colors.ink} />
        </Pressable>

        <Text style={s.topBarTitle}>Event Details</Text>

        <View style={s.topBarRight}>
          <Pressable onPress={handleShare} style={s.iconButton} accessibilityLabel="Share event">
            <Text style={s.actionEmoji}>↗️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={s.heroCard}>
          <View style={s.heroHeaderBg}>
            {category ? (
              <View style={s.badgeRow}>
                <View style={s.categoryPill}>
                  <Text style={s.categoryPillText}>{category}</Text>
                </View>
              </View>
            ) : null}

            <Text style={s.heroTitle}>{event.title}</Text>

            <View style={s.organizerRow}>
              <View style={s.orgBadge}>
                <Text style={s.orgBadgeEmoji}>🇮🇳</Text>
              </View>
              <View style={s.orgMeta}>
                <View style={s.orgNameRow}>
                  <Text style={s.orgName}>
                    {isOrganizer ? 'You are hosting this event' : 'Hosted by a community member'}
                  </Text>
                </View>
                {isOrganizer && goingCount !== undefined ? (
                  <Text style={s.orgSubtitle}>
                    {goingCount} {goingCount === 1 ? 'member' : 'members'} going
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Date & Time Card */}
        <View style={s.sectionCard}>
          <View style={s.dateSectionRow}>
            <View style={s.dateIconBox}>
              <Text style={s.dateIconEmoji}>📅</Text>
            </View>
            <View style={s.dateMeta}>
              <Text style={s.dateTitle}>{formatDate(event.startAt, 'long') ?? 'Date not set'}</Text>
              <Text style={s.timeSubtitle}>
                {formatTimeRange(event.startAt, event.endAt) ?? 'Time not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={s.sectionCard}>
          <View style={s.venueHeaderRow}>
            <View style={s.venueIconBox}>
              <Text style={s.venueIconEmoji}>📍</Text>
            </View>
            <View style={s.venueMeta}>
              <Text style={s.venueTitle}>{event.location}</Text>
            </View>
          </View>

          <View style={s.venueActionsRow}>
            <Pressable onPress={handleDirections} style={s.directionsBtn}>
              <Text style={s.directionsBtnText}>Get Directions 🗺️</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/rides?to=${encodeURIComponent(event.location)}` as Href)}
              style={s.carpoolPromoBtn}
            >
              <Text style={s.carpoolPromoText}>🚗 Find a Carpool</Text>
            </Pressable>
          </View>
        </View>

        {/* Event Overview Description */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>About the Event</Text>
          <Text style={s.bodyText}>
            {event.description || 'The host has not added a description yet.'}
          </Text>
        </View>

        {rsvpError ? (
          <View style={s.sectionCard}>
            <Text style={s.bodyText}>⚠️ {rsvpError}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={s.stickyBottomBar}>
        <View style={s.stickyBottomLeft}>
          <Text style={s.admissionLabel}>YOUR RSVP</Text>
          <Text style={s.admissionValue}>
            {myRsvp ? myRsvp.status.toLowerCase() : session ? 'Not yet' : 'Sign in to RSVP'}
          </Text>
        </View>

        <Pressable
          onPress={handleRsvp}
          disabled={rsvpMutation.isPending || myRsvp?.status?.toUpperCase() === 'GOING'}
          style={s.rsvpPrimaryBtn}
        >
          <Text style={s.rsvpPrimaryText}>
            {rsvpMutation.isPending
              ? 'Sending RSVP...'
              : myRsvp?.status?.toUpperCase() === 'GOING'
                ? "✓ You're going"
                : 'RSVP 🪔'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fe',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: sp.lg,
  },
  loadingText: {
    fontSize: 14,
    color: colors.inkSecondary,
  },
  errorEmoji: {
    fontSize: 44,
    marginBottom: sp.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.inkSecondary,
    textAlign: 'center',
    marginBottom: sp.md,
  },
  backBtn: {
    backgroundColor: colors.accentBrand,
    paddingHorizontal: sp.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  backBtnText: {
    color: colors.canvas,
    fontSize: 12,
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp.lg,
    paddingTop: sp.md,
    paddingBottom: sp.md,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 16,
  },
  scrollContent: {
    padding: sp.lg,
    paddingBottom: 110,
  },
  heroCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.panel,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    shadowColor: '#f97316',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: sp.md,
  },
  heroHeaderBg: {
    backgroundColor: '#fff7ed',
    padding: sp.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.sm,
  },
  categoryPill: {
    backgroundColor: '#ea580c',
    paddingHorizontal: sp.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  categoryPillText: {
    color: colors.canvas,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#7c2d12',
    letterSpacing: -0.5,
    marginBottom: sp.md,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
    marginBottom: sp.md,
  },
  orgBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgBadgeEmoji: {
    fontSize: 20,
  },
  orgMeta: {
    flex: 1,
  },
  orgNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7c2d12',
  },
  orgSubtitle: {
    fontSize: 11,
    color: '#9a3412',
  },
  sectionCard: {
    backgroundColor: colors.canvas,
    borderRadius: radius.card,
    padding: sp.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: sp.md,
  },
  dateSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
  },
  dateIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateIconEmoji: {
    fontSize: 20,
  },
  dateMeta: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  timeSubtitle: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '600',
    marginTop: 2,
  },
  venueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    marginBottom: sp.md,
  },
  venueIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueIconEmoji: {
    fontSize: 20,
  },
  venueMeta: {
    flex: 1,
  },
  venueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  venueActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
  },
  directionsBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  carpoolPromoBtn: {
    flex: 1.5,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carpoolPromoText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentBrand,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: sp.sm,
  },
  bodyText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 20,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: sp.lg,
    paddingVertical: sp.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyBottomLeft: {
    flex: 1,
  },
  admissionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkSecondary,
    textTransform: 'uppercase',
  },
  admissionValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  rsvpPrimaryBtn: {
    backgroundColor: colors.accentBrand,
    paddingHorizontal: sp.xl,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  rsvpPrimaryText: {
    color: colors.canvas,
    fontSize: 13,
    fontWeight: '800',
  },
});

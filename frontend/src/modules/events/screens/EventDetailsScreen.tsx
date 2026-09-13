import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { getEvent } from '@/modules/events/api';
import type { Event } from '@/modules/events/api';
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { session } = useAuthStore();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [hasRsvpd, setHasRsvpd] = useState(false);

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', resolvedEventId],
    queryFn: () => getEvent(resolvedEventId as string),
    enabled: !!resolvedEventId,
  });

  const formatEventDate = (isoString?: string) => {
    if (!isoString) return 'Saturday, October 24, 2026';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatEventTime = (start?: string, end?: string) => {
    if (!start) return '5:00 PM – 10:00 PM CDT';
    try {
      const s = new Date(start);
      const e = end ? new Date(end) : null;
      const sTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const eTime = e ? e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
      return eTime ? `${sTime} – ${eTime} CDT` : sTime;
    } catch {
      return '5:00 PM – 10:00 PM CDT';
    }
  };

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
        <Text style={s.errorSubtitle}>This event might have concluded or the link has expired.</Text>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>Back to Events</Text>
        </Pressable>
      </View>
    );
  }

  const isDiwali = event.title.toLowerCase().includes('diwali');
  const isTech = event.title.toLowerCase().includes('tech') || event.title.toLowerCase().includes('ai');

  const handleRsvp = () => {
    if (!session) {
      router.push('/sign-in' as any);
      return;
    }
    setHasRsvpd(true);
    setRsvpModalVisible(true);
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
          <Pressable
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={s.iconButton}
            accessibilityLabel="Bookmark event"
          >
            <Text style={s.actionEmoji}>{isBookmarked ? '❤️' : '🤍'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert('Link Copied', `Share link for ${event.title} copied!`);
            }}
            style={s.iconButton}
            accessibilityLabel="Share event"
          >
            <Text style={s.actionEmoji}>↗️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Festive Hero Card */}
        <View style={s.heroCard}>
          <View style={s.heroHeaderBg}>
            <View style={s.badgeRow}>
              <View style={s.categoryPill}>
                <Text style={s.categoryPillText}>
                  {isDiwali ? '🎉 Mega Cultural Festival' : isTech ? '💼 Tech & AI Meetup' : '🏏 Community Meetup'}
                </Text>
              </View>
              <View style={s.capacityPill}>
                <Text style={s.capacityPillText}>Community Event</Text>
              </View>
            </View>

            <Text style={s.heroTitle}>{event.title}</Text>

            <View style={s.organizerRow}>
              <View style={s.orgBadge}>
                <Text style={s.orgBadgeEmoji}>🇮🇳</Text>
              </View>
              <View style={s.orgMeta}>
                <View style={s.orgNameRow}>
                  <Text style={s.orgName}>
                    {isTech ? 'Austin Desi Tech Circle' : 'Community Event Organizers'}
                  </Text>
                  <Text style={s.verifiedIcon}>✓</Text>
                </View>
                <Text style={s.orgSubtitle}>Verified Community Organizers</Text>
              </View>
            </View>

            <View style={s.keyInfoRow}>
              <View style={s.infoPillGreen}>
                <Text style={s.infoPillTextGreen}>Free Community Entry</Text>
              </View>
              <View style={s.infoPill}>
                <Text style={s.infoPillText}>Family & Kid Friendly</Text>
              </View>
              <View style={s.infoPill}>
                <Text style={s.infoPillText}>Free Parking Onsite</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date, Time & Calendar Sync Card */}
        <View style={s.sectionCard}>
          <View style={s.dateSectionRow}>
            <View style={s.dateIconBox}>
              <Text style={s.dateIconEmoji}>📅</Text>
            </View>
            <View style={s.dateMeta}>
              <Text style={s.dateTitle}>{formatEventDate(event.startAt)}</Text>
              <Text style={s.timeSubtitle}>{formatEventTime(event.startAt, event.endAt)} (Gates open 30m early)</Text>
            </View>
            <Pressable
              onPress={() => Alert.alert('Calendar Sync', 'Event added to your mobile calendar.')}
              style={s.calendarSyncBtn}
            >
              <Text style={s.calendarSyncText}>+ Calendar</Text>
            </Pressable>
          </View>
        </View>

        {/* Location & Travel Hub Card */}
        <View style={s.sectionCard}>
          <View style={s.venueHeaderRow}>
            <View style={s.venueIconBox}>
              <Text style={s.venueIconEmoji}>📍</Text>
            </View>
            <View style={s.venueMeta}>
              <Text style={s.venueTitle}>{event.location}</Text>
              <Text style={s.venueSubtitle}>Round Rock / Austin Metro · Free General Parking</Text>
            </View>
          </View>

          <View style={s.venueActionsRow}>
            <Pressable
              onPress={() => Alert.alert('Opening Navigation', `Navigating to ${event.location}`)}
              style={s.directionsBtn}
            >
              <Text style={s.directionsBtnText}>Get Directions 🗺️</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/rides' as any)}
              style={s.carpoolPromoBtn}
            >
              <Text style={s.carpoolPromoText}>🚗 Carpool Rides Available</Text>
            </Pressable>
          </View>
        </View>

        {/* Live RSVP & Social Proof */}
        <View style={s.socialProofCard}>
          <View style={s.socialHeaderRow}>
            <Text style={s.socialStatText}>👥 Community RSVPs Open</Text>
            <Text style={s.mutualText}>ManaBandhu Members</Text>
          </View>
          <View style={s.avatarClusterRow}>
            {['👩‍💼', '👨‍💻', '👩‍🔬', '👨‍🏫', '👩‍🎨', '👨‍🔧'].map((emoji, idx) => (
              <View key={idx} style={[s.avatarClusterItem, { marginLeft: idx > 0 ? -8 : 0 }]}>
                <Text style={s.avatarClusterEmoji}>{emoji}</Text>
              </View>
            ))}
            <Text style={s.clusterCountText}>Desi community gathering</Text>
          </View>
        </View>

        {/* Event Overview Description */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>About the Event</Text>
          <Text style={s.bodyText}>{event.description}</Text>
        </View>

        {/* Detailed Festival Timeline */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Event Schedule & Highlights</Text>
          <View style={s.timeline}>
            {(isDiwali
              ? [
                  {
                    time: '5:00 PM',
                    title: 'Gates Open & Desi Street Food Bazaar',
                    desc: 'Live chaat counters, dosas, Hyderabadi dum biryani, fresh hot jalebis, kulfi, and festive clothing bazaar.',
                  },
                  {
                    time: '6:30 PM',
                    title: 'Traditional Cultural Dance & Music Showcase',
                    desc: 'Classical Kuchipudi and Bharatanatyam performances followed by high-energy Bhangra and Telugu folk dances.',
                  },
                  {
                    time: '8:30 PM',
                    title: 'Grand Musical Diwali Fireworks Spectacular',
                    desc: 'Central Texas’s largest synchronized community fireworks show lighting up the night sky.',
                  },
                  {
                    time: '9:15 PM',
                    title: 'Open Dance Floor & Bollywood DJ Night',
                    desc: 'Live Dhol players, Gujarati Garba & Bollywood mega mix on the lawn till 10:00 PM.',
                  },
                ]
              : [
                  {
                    time: 'Doors Open',
                    title: 'Attendee Check-in & Mingling',
                    desc: 'Connect with community members and get seated.',
                  },
                  {
                    time: 'Main Event',
                    title: event.title,
                    desc: event.description || 'Community program and interactive activities.',
                  },
                ]
            ).map((item, idx) => (
              <View key={idx} style={s.timelineRow}>
                <View style={s.timeBadge}>
                  <Text style={s.timeBadgeText}>{item.time}</Text>
                </View>
                <View style={s.timelineContent}>
                  <Text style={s.timelineItemTitle}>{item.title}</Text>
                  <Text style={s.timelineItemDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Venue Facilities Grid */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Venue Amenities</Text>
          <View style={s.amenitiesGrid}>
            {[
              { icon: '🚗', name: 'Free General Parking' },
              { icon: '🎪', name: 'Kids Play Arena' },
              { icon: '🍛', name: 'Pure Veg & Halal Food' },
              { icon: '🩺', name: 'Medical First Aid Onsite' },
              { icon: '🛡️', name: 'Police & Security' },
              { icon: '♿', name: 'Wheelchair Accessible' },
            ].map((am) => (
              <View key={am.name} style={s.amenityTile}>
                <Text style={s.amenityIcon}>{am.icon}</Text>
                <Text style={s.amenityName}>{am.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={s.stickyBottomBar}>
        <View style={s.stickyBottomLeft}>
          <Text style={s.admissionLabel}>ADMISSION</Text>
          <Text style={s.admissionValue}>100% Free Entry</Text>
        </View>

        <Pressable onPress={handleRsvp} style={s.rsvpPrimaryBtn}>
          <Text style={s.rsvpPrimaryText}>
            {hasRsvpd ? '✓ RSVP Confirmed (View Ticket)' : 'RSVP Free Spot 🪔'}
          </Text>
        </Pressable>
      </View>

      {/* Digital RSVP Ticket Modal */}
      <Modal
        visible={rsvpModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setRsvpModalVisible(false)}
      >
        <View style={[s.modalBackdrop, isDesktop && s.modalBackdropDesktop]}>
          <View style={[s.modalCard, isDesktop && s.modalCardDesktop]}>
            {!isDesktop && <View style={s.dragHandle} />}

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Your Community RSVP Ticket</Text>
              <Pressable onPress={() => setRsvpModalVisible(false)} style={s.closeModalBtn}>
                <Text style={s.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <View style={s.ticketContainer}>
              <View style={s.ticketTop}>
                <Text style={s.ticketCategory}>MANABANDHU VERIFIED PASS</Text>
                <Text style={s.ticketEventTitle}>{event.title}</Text>
                <Text style={s.ticketMeta}>📅 {formatEventDate(event.startAt)}</Text>
                <Text style={s.ticketMeta}>📍 {event.location}</Text>
              </View>

              <View style={s.ticketDivider}>
                <View style={s.cutoutLeft} />
                <View style={s.dashedLine} />
                <View style={s.cutoutRight} />
              </View>

              <View style={s.ticketBottom}>
                <View style={s.qrBox}>
                  <Text style={s.qrEmoji}>🏁 [QR: MB-{event.id.slice(0, 8).toUpperCase()}]</Text>
                </View>
                <Text style={s.qrInstructions}>Show this digital pass at the entrance gate for quick check-in.</Text>
              </View>
            </View>

            <Pressable
              onPress={() => setRsvpModalVisible(false)}
              style={s.doneTicketBtn}
            >
              <Text style={s.doneTicketBtnText}>Save Ticket & Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  capacityPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: sp.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  capacityPillText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '800',
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
  verifiedIcon: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '900',
  },
  orgSubtitle: {
    fontSize: 11,
    color: '#9a3412',
  },
  keyInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoPillGreen: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  infoPillTextGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  infoPill: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: '600',
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
  calendarSyncBtn: {
    backgroundColor: colors.canvasMuted,
    paddingHorizontal: sp.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  calendarSyncText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
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
  venueSubtitle: {
    fontSize: 12,
    color: colors.inkSecondary,
    marginTop: 2,
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
  socialProofCard: {
    backgroundColor: '#fefce8',
    borderRadius: radius.card,
    padding: sp.md,
    borderWidth: 1,
    borderColor: '#fef08a',
    marginBottom: sp.md,
  },
  socialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.xs,
  },
  socialStatText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854d0e',
  },
  mutualText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a16207',
  },
  avatarClusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarClusterItem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fefce8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarClusterEmoji: {
    fontSize: 14,
  },
  clusterCountText: {
    fontSize: 11,
    color: '#854d0e',
    marginLeft: sp.sm,
    fontWeight: '600',
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
  timeline: {
    gap: sp.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp.md,
  },
  timeBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.control,
    width: 76,
    alignItems: 'center',
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentBrand,
  },
  timelineContent: {
    flex: 1,
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  timelineItemDesc: {
    fontSize: 11,
    color: colors.inkSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.sm,
  },
  amenityTile: {
    width: '48%',
    backgroundColor: colors.canvasMuted,
    borderRadius: radius.control,
    padding: sp.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 4,
  },
  amenityIcon: {
    fontSize: 20,
  },
  amenityName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: sp.lg,
    maxHeight: '85%',
  },
  modalCardDesktop: {
    width: 480,
    borderRadius: radius.panel,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: sp.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sp.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  closeModalBtn: {
    padding: 4,
  },
  closeModalText: {
    fontSize: 16,
    color: colors.inkSecondary,
    fontWeight: '700',
  },
  ticketContainer: {
    backgroundColor: '#fff7ed',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    overflow: 'hidden',
    marginBottom: sp.lg,
  },
  ticketTop: {
    padding: sp.lg,
  },
  ticketCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  ticketEventTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#7c2d12',
    marginBottom: sp.sm,
  },
  ticketMeta: {
    fontSize: 12,
    color: '#9a3412',
    fontWeight: '600',
    marginTop: 2,
  },
  ticketDivider: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  cutoutLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    marginLeft: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderStyle: 'dashed',
  },
  cutoutRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    marginRight: -10,
  },
  ticketBottom: {
    padding: sp.lg,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
  },
  qrBox: {
    backgroundColor: colors.canvas,
    paddingHorizontal: sp.md,
    paddingVertical: sp.sm,
    borderRadius: radius.control,
    marginBottom: sp.xs,
  },
  qrEmoji: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7c2d12',
  },
  qrInstructions: {
    fontSize: 11,
    color: '#9a3412',
    textAlign: 'center',
  },
  doneTicketBtn: {
    backgroundColor: colors.accentBrand,
    height: 44,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTicketBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.canvas,
  },
});

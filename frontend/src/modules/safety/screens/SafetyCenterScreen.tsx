import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSafetyCenter } from '@/modules/safety/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

const C = {
  primary: '#431ebe',
  secondary: '#00696b',
  accent: '#ff7e33',
  bg: '#faf8ff',
  cardBg: '#FFFFFF',
  border: '#E8E5F2',
  ink: '#1B1829',
  inkMuted: '#6B6882',
  emerald: '#16A34A',
  emeraldBg: '#DCFCE7',
  crimson: '#DC2626',
  crimsonBg: '#FEE2E2',
  tealBg: '#E0F5F5',
  saffronBg: '#FFF0E8',
};

const DEFAULT_SAFETY_DATA = {
  title: 'Safety Center',
  subtitle: 'Manage reports, blocked users, trusted contacts, and emergency escalation.',
  eyebrow: 'Safety',
  metrics: [
    { label: 'Open reports', value: '0' },
    { label: 'Blocked users', value: '0' },
  ],
  items: [
    { id: 'reports', title: 'Your reports', body: 'Track reports you have submitted and their status.', meta: 'Open reports', route: '/safety/reports', status: null },
    { id: 'blocked', title: 'Blocked users', body: 'Manage users you have blocked and the reasons.', meta: 'Blocked', route: '/safety/blocked-users', status: null },
    { id: 'trusted', title: 'Trusted contacts', body: 'Manage people you trust for safety check-ins.', meta: 'Trusted', route: '/safety/trusted-contacts', status: null },
  ],
};

export function SafetyCenterScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const isDesktop = width >= 768;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const center = useQuery({ queryKey: ['safety', 'center'], queryFn: getSafetyCenter, retry: false });

  if (center.isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centerContainer}>
          <LoadingState label="Loading safety center..." />
        </View>
      </SafeAreaView>
    );
  }

  const data = center.data ?? DEFAULT_SAFETY_DATA;
  const metrics = data.metrics ?? [];

  const tools: {
    id: string;
    icon: AppIconName;
    title: string;
    subtitle: string;
    route: string;
    bg: string;
    iconColor: string;
  }[] = [
    {
      id: 'trusted',
      icon: 'shield',
      title: 'Trusted Contacts',
      subtitle: 'Designate family or friends for ride status and safe check-ins',
      route: '/safety/trusted-contacts',
      bg: '#E0F2FE',
      iconColor: '#0369A1',
    },
    {
      id: 'reports',
      icon: 'book',
      title: 'Safety Reports',
      subtitle: 'Track your submitted incident reports and community moderation updates',
      route: '/safety/reports',
      bg: '#FEF3C7',
      iconColor: '#B45309',
    },
    {
      id: 'blocked',
      icon: 'eye-closed',
      title: 'Blocked Users',
      subtitle: 'Review and manage members you have restricted from contacting you',
      route: '/safety/blocked-users',
      bg: '#F3F4F6',
      iconColor: '#4B5563',
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        {/* Top Header */}
        <View style={s.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={s.backBtn}
          >
            <AppIcon name="chevron-left" size={20} color={C.ink} />
          </Pressable>
          <View style={s.headerTitleCol}>
            <Text style={s.headerEyebrow}>Community Trust & Care</Text>
            <Text style={s.headerTitle}>Safety Center</Text>
          </View>
        </View>

        {/* Emergency Assistance Banner */}
        <View style={s.sosBanner}>
          <View style={s.sosHeaderRow}>
            <View style={s.sosIconOuter}>
              <Animated.View style={[s.sosHalo, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.25], outputRange: [0.6, 0] }) }]} />
              <View style={s.sosIconWrap}>
                <AppIcon name="warning" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={s.sosTextWrap}>
              <Text style={s.sosTitle}>In an Immediate Emergency?</Text>
              <Text style={s.sosSubtitle}>Call 911 for emergency services, police, or ambulance assistance.</Text>
            </View>
          </View>
          <View style={s.sosActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call 911"
              onPress={() => Linking.openURL('tel:911')}
              style={s.call911Btn}
            >
              <Text style={s.call911Text}>Call 911 Now</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Crisis Helpline 988"
              onPress={() => Linking.openURL('tel:988')}
              style={s.helplineBtn}
            >
              <Text style={s.helplineText}>Crisis Line 988</Text>
            </Pressable>
          </View>
        </View>

        {/* Metrics Bar */}
        {metrics.length > 0 ? (
          <View style={s.metricsRow}>
            {metrics.map((m, idx) => (
              <View key={idx} style={s.metricCard}>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Safety Tools Section */}
        <Text style={s.sectionTitle}>Safety Tools & Controls</Text>
        <View style={s.toolsList}>
          {tools.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(item.route as any)}
              style={s.toolCard}
            >
              <View style={[s.toolIconBox, { backgroundColor: item.bg }]}>
                <AppIcon name={item.icon} size={22} color={item.iconColor} />
              </View>
              <View style={s.toolInfo}>
                <Text style={s.toolTitle}>{item.title}</Text>
                <Text style={s.toolSubtitle}>{item.subtitle}</Text>
              </View>
              <AppIcon name="chevron-right" size={18} color={C.inkMuted} />
            </Pressable>
          ))}
        </View>

        {/* Community Trust Principles */}
        <Text style={[s.sectionTitle, { marginTop: 28 }]}>ManaBandhu Trust Standards</Text>
        <View style={s.trustCard}>
          <View style={s.trustItem}>
            <View style={s.trustDot} />
            <View style={s.trustContent}>
              <Text style={s.trustHeading}>Verified Member Identity</Text>
              <Text style={s.trustDesc}>
                All room hosts, drivers, and referrers undergo ID and contact verification before listing.
              </Text>
            </View>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <View style={s.trustDot} />
            <View style={s.trustContent}>
              <Text style={s.trustHeading}>Zero Harassment Policy</Text>
              <Text style={s.trustDesc}>
                Strict zero tolerance for scams, abusive behavior, or discrimination. Accounts are banned upon verification.
              </Text>
            </View>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <View style={s.trustDot} />
            <View style={s.trustContent}>
              <Text style={s.trustHeading}>Shareable Trip & Stay Details</Text>
              <Text style={s.trustDesc}>
                Always share your ride route or room visit details with your Trusted Contacts with one tap.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  contentDesktop: {
    padding: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.ink,
  },
  sosBanner: {
    backgroundColor: '#991B1B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  sosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sosIconOuter: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  sosIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sosSubtitle: {
    fontSize: 13,
    color: '#FEE2E2',
    lineHeight: 18,
  },
  sosActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  call911Btn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  call911Text: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  helplineBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  helplineText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.secondary,
  },
  metricLabel: {
    fontSize: 12,
    color: C.inkMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 12,
  },
  toolsList: {
    gap: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 14,
  },
  toolIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 2,
  },
  toolSubtitle: {
    fontSize: 12,
    color: C.inkMuted,
    lineHeight: 16,
  },
  trustCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    gap: 14,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  trustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
    marginTop: 6,
  },
  trustContent: {
    flex: 1,
  },
  trustHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 12,
    color: C.inkMuted,
    lineHeight: 17,
  },
  trustDivider: {
    height: 1,
    backgroundColor: C.border,
    opacity: 0.6,
  },
});

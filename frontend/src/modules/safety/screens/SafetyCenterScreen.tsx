import { breakpoint, radius } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getBlockedUsers,
  getReports,
  getTrustedContacts,
  isOpenReport,
} from '@/modules/safety/api';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useWindowDimensions } from '@/platform/windowDimensions';

const createScreenColors = (palette: ScreenPalette) => ({
  primary: palette.primary,
  secondary: palette.teal,
  accent: palette.warm,
  bg: palette.background,
  cardBg: palette.surface,
  border: palette.border,
  ink: palette.ink,
  inkMuted: palette.muted,
  emerald: palette.success,
  emeraldBg: palette.successBg,
  crimson: palette.error,
  crimsonBg: palette.errorBg,
  tealBg: palette.tealBg,
  saffronBg: palette.warmBg,
});

export function SafetyCenterScreen() {
  const { styles: s, palette } = useScreenStyles(createScreenStyles);
  const C = createScreenColors(palette);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const _isCompact = width < breakpoint.narrow;
  const isDesktop = width >= breakpoint.medium;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Counts come from the caller's own lists; nothing is shown until they load, and a failure shows an error.
  const reports = useQuery({ queryKey: ['safety', 'reports'], queryFn: getReports });
  const blockedUsers = useQuery({
    queryKey: ['safety', 'blocked-users'],
    queryFn: getBlockedUsers,
  });
  const trustedContacts = useQuery({
    queryKey: ['safety', 'trusted-contacts'],
    queryFn: getTrustedContacts,
  });

  const metricsLoading = reports.isLoading || blockedUsers.isLoading || trustedContacts.isLoading;
  const metricsError = reports.isError || blockedUsers.isError || trustedContacts.isError;
  const metrics =
    reports.data && blockedUsers.data && trustedContacts.data
      ? [
          { label: 'Open reports', value: String(reports.data.filter(isOpenReport).length) },
          { label: 'Blocked users', value: String(blockedUsers.data.length) },
          { label: 'Trusted contacts', value: String(trustedContacts.data.length) },
        ]
      : [];

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
      bg: palette.infoBg,
      iconColor: palette.info,
    },
    {
      id: 'reports',
      icon: 'book',
      title: 'Safety Reports',
      subtitle: 'Track your submitted incident reports and community moderation updates',
      route: '/safety/reports',
      bg: palette.goldBg,
      iconColor: palette.goldText,
    },
    {
      id: 'blocked',
      icon: 'eye-closed',
      title: 'Blocked Users',
      subtitle: 'Review and manage members you have restricted from contacting you',
      route: '/safety/blocked-users',
      bg: palette.surfaceContainerLow,
      iconColor: palette.muted,
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        {/* Top Header */}
        <ScreenHeader
          title="Safety center"
          subtitle="Get help. Set boundaries. Look out for each other."
          back={{ fallback: '/explore' }}
        />

        {/* Emergency Assistance Banner */}
        <View style={s.sosBanner}>
          <View style={s.sosHeaderRow}>
            <View style={s.sosIconOuter}>
              <Animated.View
                style={[
                  s.sosHalo,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.25],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]}
              />
              <View style={s.sosIconWrap}>
                <AppIcon name="warning" size={20} color={palette.editorialInk} />
              </View>
            </View>
            <View style={s.sosTextWrap}>
              <Text style={s.sosTitle}>In an Immediate Emergency?</Text>
              <Text style={s.sosSubtitle}>
                Call 911 for emergency services, police, or ambulance assistance.
              </Text>
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

        {/* Metrics Bar: the signed-in user's own counts */}
        {metricsLoading ? (
          <LoadingState label="Loading your safety summary..." />
        ) : metricsError ? (
          <ErrorState
            title="Unable to load your safety summary"
            body="Your reports, blocked users, and trusted contacts could not be loaded."
            retryLabel="Retry"
            onRetry={() => {
              reports.refetch();
              blockedUsers.refetch();
              trustedContacts.refetch();
            }}
          />
        ) : (
          <View style={s.metricsRow}>
            {metrics.map((m) => (
              <View key={m.label} style={s.metricCard}>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safety Tools Section */}
        <Text style={s.sectionTitle}>Safety Tools & Controls</Text>
        <View style={s.toolsList}>
          {tools.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(item.route as Href)}
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
              <Text style={s.trustHeading}>Signed-in members only</Text>
              <Text style={s.trustDesc}>
                Rooms, rides, and referrals can only be posted by signed-in members, and any member
                can be reported or blocked.
              </Text>
            </View>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <View style={s.trustDot} />
            <View style={s.trustContent}>
              <Text style={s.trustHeading}>Zero Harassment Policy</Text>
              <Text style={s.trustDesc}>
                Strict zero tolerance for scams, abusive behavior, or discrimination. Accounts are
                banned upon verification.
              </Text>
            </View>
          </View>
          <View style={s.trustDivider} />
          <View style={s.trustItem}>
            <View style={s.trustDot} />
            <View style={s.trustContent}>
              <Text style={s.trustHeading}>Shareable Trip & Stay Details</Text>
              <Text style={s.trustDesc}>
                Always share your ride route or room visit details with your Trusted Contacts with
                one tap.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  const C = createScreenColors(palette);
  return StyleSheet.create({
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
      borderRadius: radius.card,
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
      backgroundColor: palette.editorialDanger,
      borderRadius: radius.card,
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
      borderRadius: radius.card,
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
      color: palette.editorialInk,
      marginBottom: 2,
    },
    sosSubtitle: {
      fontSize: 13,
      color: palette.editorialInk,
      lineHeight: 18,
    },
    sosActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    call911Btn: {
      minHeight: 44,
      minWidth: 44,
      flex: 1,
      backgroundColor: palette.editorialDanger,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
    },
    call911Text: {
      color: palette.editorialInk,
      fontWeight: '800',
      fontSize: 14,
    },
    helplineBtn: {
      minHeight: 44,
      minWidth: 44,
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    helplineText: {
      color: palette.editorialInk,
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
      borderRadius: radius.control,
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
      minHeight: 44,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
      gap: 14,
    },
    toolIconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.control,
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
      borderRadius: radius.control,
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
};

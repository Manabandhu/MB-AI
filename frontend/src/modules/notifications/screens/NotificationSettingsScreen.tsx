import { radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotificationSettings, updateNotificationSettings } from '@/modules/notifications/api';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

// Visual Design Tokens
const C = {
  primary: '#431ebe',
  secondary: '#00696b',
  bg: '#faf8ff',
  surface: '#ffffff',
  surfaceSubtle: '#f4f2ff',
  border: '#e8e5f5',
  ink: '#131b2e',
  inkMuted: '#625f6e',
  emerald: '#1b873f',
  emeraldBg: '#e6f7ed',
  teal: '#00696b',
  tealBg: '#e6f4f4',
  amber: '#b45309',
  amberBg: '#fef3c7',
  rose: '#dc2626',
  roseBg: '#fee2e2',
  purple: '#6d28d9',
  purpleBg: '#ede9fe',
};

type DeliveryPace = 'instant' | 'batch' | 'daily';

interface ChannelConfig {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  icon: AppIconName;
  iconBg: string;
  iconColor: string;
  badge?: string;
  locked?: boolean;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'push',
    key: 'push',
    title: 'Push Notifications',
    subtitle: 'Instant alerts on your phone or web browser for messages and updates',
    icon: 'bell',
    iconBg: C.purpleBg,
    iconColor: C.purple,
    badge: 'Recommended',
  },
  {
    id: 'inApp',
    key: 'inApp',
    title: 'In-App Alerts',
    subtitle: 'Notification inbox badges, unread banners, and activity feeds',
    icon: 'mail',
    iconBg: C.tealBg,
    iconColor: C.teal,
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email Summaries',
    subtitle: 'Weekly digest of matches, monthly housing insights, and receipts',
    icon: 'mail',
    iconBg: C.amberBg,
    iconColor: C.amber,
  },
  {
    id: 'sms',
    key: 'sms',
    title: 'SMS & WhatsApp Broadcast',
    subtitle: 'Time-sensitive ride pickup alerts and emergency travel updates',
    icon: 'phone',
    iconBg: C.emeraldBg,
    iconColor: C.emerald,
  },
];

const MODULE_ALERTS: ChannelConfig[] = [
  {
    id: 'housingAlerts',
    key: 'housingAlerts',
    title: 'Housing & Flatmates',
    subtitle: 'New rooms matching saved cities, flatmate inquiries, and price drops',
    icon: 'home',
    iconBg: C.purpleBg,
    iconColor: C.purple,
  },
  {
    id: 'rideAlerts',
    key: 'rideAlerts',
    title: 'Carpools & Rides',
    subtitle: 'Driver departures along your corridor, seat booking confirmations, and ETAs',
    icon: 'car',
    iconBg: C.tealBg,
    iconColor: C.teal,
  },
  {
    id: 'jobAlerts',
    key: 'jobAlerts',
    title: 'Job & Tech Referrals',
    subtitle: 'Verified employee referral drops at top tech firms, mentorship requests',
    icon: 'briefcase',
    iconBg: C.amberBg,
    iconColor: C.amber,
  },
  {
    id: 'communityEvents',
    key: 'communityEvents',
    title: 'Community & Cultural Events',
    subtitle: 'Diwali/Holi festivals, local sports leagues, and trending metro discussions',
    icon: 'calendar',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
  },
  {
    id: 'safetyAlerts',
    key: 'safetyAlerts',
    title: 'Safety & Emergency SOS',
    subtitle: 'Emergency contact broadcasts, safety check-in pings, and verification updates',
    icon: 'shield',
    iconBg: C.roseBg,
    iconColor: C.rose,
    badge: 'Mandatory',
    locked: true,
  },
];

export function NotificationSettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Local optimistic preference state
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    allNotifications: true,
    push: true,
    inApp: true,
    email: true,
    sms: false,
    housingAlerts: true,
    rideAlerts: true,
    jobAlerts: true,
    communityEvents: true,
    safetyAlerts: true,
    quietHours: true,
  });

  const [deliveryPace, setDeliveryPace] = useState<DeliveryPace>('instant');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAnim] = useState(() => new Animated.Value(0));

  // Query settings from backend
  const { data } = useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: getNotificationSettings,
    retry: false,
  });

  // Sync backend preferences into local state
  useEffect(() => {
    if (data?.preferences) {
      setPreferences((prev) => ({
        ...prev,
        ...data.preferences,
      }));
    }
  }, [data]);

  // Mutation for saving preferences
  const mutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (res) => {
      queryClient.setQueryData(['notifications', 'settings'], res);
      showToast('Preferences saved');
    },
    onError: () => {
      showToast('Saved locally');
    },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  };

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...preferences, [key]: value };

    // If master toggle changed
    if (key === 'allNotifications') {
      if (!value) {
        // Mute all except mandatory safety
        Object.keys(updated).forEach((k) => {
          if (k !== 'safetyAlerts') updated[k] = false;
        });
      } else {
        // Restore standard defaults
        updated.push = true;
        updated.inApp = true;
        updated.housingAlerts = true;
        updated.rideAlerts = true;
        updated.jobAlerts = true;
        updated.communityEvents = true;
      }
    } else if (value && !preferences.allNotifications) {
      updated.allNotifications = true;
    }

    setPreferences(updated);
    mutation.mutate(updated);
  };

  const handleResetDefaults = () => {
    const defaults = {
      allNotifications: true,
      push: true,
      inApp: true,
      email: true,
      sms: false,
      housingAlerts: true,
      rideAlerts: true,
      jobAlerts: true,
      communityEvents: true,
      safetyAlerts: true,
      quietHours: true,
    };
    setPreferences(defaults);
    setDeliveryPace('instant');
    mutation.mutate(defaults);
    showToast('Reset to defaults');
  };

  const activeChannelCount = [
    preferences.push,
    preferences.inApp,
    preferences.email,
    preferences.sms,
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Toast Feedback Notification */}
      {toastMessage ? (
        <Animated.View
          style={[
            styles.toastBubble,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <AppIcon name="check" size={14} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Navigation Bar */}
          <View style={styles.topHeader}>
            <View style={styles.headerLeft}>
              <Pressable
                accessibilityLabel="Back to Notifications"
                accessibilityRole="button"
                onPress={() => router.push('/notifications')}
                style={styles.backBtn}
              >
                <AppIcon color={C.ink} name="chevron-left" size={20} />
              </Pressable>
              <View>
                <View style={styles.badgeRow}>
                  <Text style={styles.eyebrow}>Preferences</Text>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>
                      {preferences.allNotifications ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.headerTitle}>Notification Settings</Text>
                <Text style={styles.headerSubtitle}>
                  Control how and when ManaBandhu keeps you informed
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel="Reset to defaults"
              accessibilityRole="button"
              onPress={handleResetDefaults}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset Defaults</Text>
            </Pressable>
          </View>

          {/* Master Notification Switch Card */}
          <View style={styles.masterCard}>
            <View style={styles.masterHeader}>
              <View style={styles.masterIconBubble}>
                <AppIcon color={C.primary} name="bell" size={24} />
              </View>
              <View style={styles.masterTextCol}>
                <Text style={styles.masterTitle}>All Notifications</Text>
                <Text style={styles.masterSub}>
                  {preferences.allNotifications
                    ? `${activeChannelCount} delivery channels active`
                    : 'All non-critical notifications paused'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Master notifications switch"
                onValueChange={(val) => handleToggle('allNotifications', val)}
                thumbColor="#ffffff"
                trackColor={{ false: '#d5dafc', true: C.primary }}
                value={preferences.allNotifications}
              />
            </View>

            {/* Quick Summary Pill Bar */}
            <View style={styles.statPillsRow}>
              <View style={styles.statPill}>
                <AppIcon color={C.teal} name="check" size={13} strokeWidth={2.5} />
                <Text style={styles.statPillText}>Push & In-App Enabled</Text>
              </View>
              <View style={styles.statPill}>
                <AppIcon color={C.purple} name="shield" size={13} />
                <Text style={styles.statPillText}>Safety Always Protected</Text>
              </View>
            </View>
          </View>

          {/* Section 1: Delivery Channels */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Channels</Text>
              <Text style={styles.sectionSub}>
                Select the platforms where you want alerts delivered
              </Text>
            </View>

            <View style={styles.cardGroup}>
              {CHANNELS.map((ch, idx) => {
                const isEnabled = preferences[ch.key] ?? false;
                const isLast = idx === CHANNELS.length - 1;
                return (
                  <View key={ch.id}>
                    <View style={styles.settingRow}>
                      <View style={[styles.channelIconWrap, { backgroundColor: ch.iconBg }]}>
                        <AppIcon color={ch.iconColor} name={ch.icon} size={18} />
                      </View>

                      <View style={styles.settingInfo}>
                        <View style={styles.titleWithBadge}>
                          <Text style={styles.settingTitle}>{ch.title}</Text>
                          {ch.badge ? (
                            <View style={styles.pillBadge}>
                              <Text style={styles.pillBadgeText}>{ch.badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.settingSubtitle}>{ch.subtitle}</Text>
                      </View>

                      <Switch
                        accessibilityLabel={ch.title}
                        disabled={ch.locked || !preferences.allNotifications}
                        onValueChange={(val) => handleToggle(ch.key, val)}
                        thumbColor="#ffffff"
                        trackColor={{ false: '#e2e8f0', true: C.secondary }}
                        value={isEnabled}
                      />
                    </View>
                    {!isLast ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section 2: Module Subscriptions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Module Subscriptions</Text>
              <Text style={styles.sectionSub}>
                Customize notifications for housing, carpools, referrals, and community
              </Text>
            </View>

            <View style={styles.cardGroup}>
              {MODULE_ALERTS.map((item, idx) => {
                const isEnabled = preferences[item.key] ?? false;
                const isLast = idx === MODULE_ALERTS.length - 1;
                return (
                  <View key={item.id}>
                    <View style={styles.settingRow}>
                      <View style={[styles.channelIconWrap, { backgroundColor: item.iconBg }]}>
                        <AppIcon color={item.iconColor} name={item.icon} size={18} />
                      </View>

                      <View style={styles.settingInfo}>
                        <View style={styles.titleWithBadge}>
                          <Text style={styles.settingTitle}>{item.title}</Text>
                          {item.badge ? (
                            <View style={[styles.pillBadge, item.locked && styles.lockedBadge]}>
                              <Text
                                style={[
                                  styles.pillBadgeText,
                                  item.locked && styles.lockedBadgeText,
                                ]}
                              >
                                {item.badge}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                      </View>

                      <Switch
                        accessibilityLabel={item.title}
                        disabled={item.locked || !preferences.allNotifications}
                        onValueChange={(val) => handleToggle(item.key, val)}
                        thumbColor="#ffffff"
                        trackColor={{ false: '#e2e8f0', true: C.primary }}
                        value={isEnabled}
                      />
                    </View>
                    {!isLast ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section 3: Quiet Hours & Frequency */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quiet Hours & Delivery Pace</Text>
              <Text style={styles.sectionSub}>
                Silence non-urgent notifications during sleep or bundle them into digests
              </Text>
            </View>

            <View style={styles.cardGroup}>
              {/* Quiet Hours Switch */}
              <View style={styles.settingRow}>
                <View style={[styles.channelIconWrap, { backgroundColor: '#EDE9FE' }]}>
                  <AppIcon color={C.purple} name="star" size={18} />
                </View>

                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Quiet Hours (Do Not Disturb)</Text>
                  <Text style={styles.settingSubtitle}>
                    Mute sound & alerts between 10:00 PM and 7:00 AM (urgent rides & SOS excluded)
                  </Text>
                </View>

                <Switch
                  accessibilityLabel="Quiet Hours"
                  onValueChange={(val) => handleToggle('quietHours', val)}
                  thumbColor="#ffffff"
                  trackColor={{ false: '#e2e8f0', true: C.purple }}
                  value={preferences.quietHours ?? true}
                />
              </View>

              <View style={styles.divider} />

              {/* Delivery Frequency Segmented Picker */}
              <View style={styles.paceContainer}>
                <Text style={styles.paceLabel}>DELIVERY FREQUENCY</Text>
                <View style={styles.paceSegments}>
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: deliveryPace === 'instant' }}
                    onPress={() => {
                      setDeliveryPace('instant');
                      showToast('Pace set to Instant');
                    }}
                    style={[styles.paceBtn, deliveryPace === 'instant' && styles.paceBtnActive]}
                  >
                    <Text
                      style={[
                        styles.paceBtnText,
                        deliveryPace === 'instant' && styles.paceBtnTextActive,
                      ]}
                    >
                      Instant
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: deliveryPace === 'batch' }}
                    onPress={() => {
                      setDeliveryPace('batch');
                      showToast('Pace set to 2-Hour Batch');
                    }}
                    style={[styles.paceBtn, deliveryPace === 'batch' && styles.paceBtnActive]}
                  >
                    <Text
                      style={[
                        styles.paceBtnText,
                        deliveryPace === 'batch' && styles.paceBtnTextActive,
                      ]}
                    >
                      2-Hr Batch
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: deliveryPace === 'daily' }}
                    onPress={() => {
                      setDeliveryPace('daily');
                      showToast('Pace set to Daily Digest');
                    }}
                    style={[styles.paceBtn, deliveryPace === 'daily' && styles.paceBtnActive]}
                  >
                    <Text
                      style={[
                        styles.paceBtnText,
                        deliveryPace === 'daily' && styles.paceBtnTextActive,
                      ]}
                    >
                      Daily Digest
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Navigation CTA */}
          <View style={styles.footerActionRow}>
            <Pressable
              accessibilityLabel="Return to Notifications Inbox"
              accessibilityRole="button"
              onPress={() => router.push('/notifications')}
              style={styles.inboxBtn}
            >
              <AppIcon color="#ffffff" name="bell" size={16} />
              <Text style={styles.inboxBtnText}>Go to Notifications Inbox</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: space.x4,
    paddingVertical: space.x6,
    flexGrow: 1,
  },
  scrollContentDesktop: {
    paddingHorizontal: space.x8,
    paddingVertical: space.x8,
    alignItems: 'center',
  },
  container: {
    maxWidth: 720,
    width: '100%',
    gap: space.x6,
  },

  // Toast
  toastBubble: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: '#131b2e',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.x3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eyebrow: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e6f7ed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.emerald,
  },
  liveText: {
    color: C.emerald,
    fontSize: 11,
    fontWeight: '800',
  },
  headerTitle: {
    color: C.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: C.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  resetBtnText: {
    color: C.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },

  // Master Card
  masterCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: space.x5,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    gap: space.x4,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.x3,
  },
  masterIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f2edff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterTextCol: {
    flex: 1,
    gap: 2,
  },
  masterTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  masterSub: {
    color: C.inkMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: space.x1,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statPillText: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '700',
  },

  // Sections
  section: {
    gap: space.x3,
  },
  sectionHeader: {
    gap: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSub: {
    color: C.inkMuted,
    fontSize: 12,
    lineHeight: 16,
  },

  // Card Group
  cardGroup: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.x4,
    paddingVertical: space.x4,
    gap: space.x3,
  },
  channelIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
    gap: 3,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  settingSubtitle: {
    color: C.inkMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  pillBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pillBadgeText: {
    color: C.purple,
    fontSize: 10,
    fontWeight: '800',
  },
  lockedBadge: {
    backgroundColor: '#fee2e2',
  },
  lockedBadgeText: {
    color: '#dc2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f0f7',
    marginLeft: 62,
  },

  // Delivery Frequency
  paceContainer: {
    paddingHorizontal: space.x4,
    paddingVertical: space.x4,
    gap: space.x3,
  },
  paceLabel: {
    color: C.inkMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  paceSegments: {
    flexDirection: 'row',
    backgroundColor: C.surfaceSubtle,
    padding: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  paceBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  paceBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  paceBtnText: {
    color: C.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  paceBtnTextActive: {
    color: C.primary,
    fontWeight: '800',
  },

  // Footer
  footerActionRow: {
    marginTop: space.x2,
    marginBottom: space.x8,
    alignItems: 'center',
  },
  inboxBtn: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inboxBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

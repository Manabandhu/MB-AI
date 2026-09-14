import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { useAuthStore } from '@/lib/authStore';

const C = {
  primary: '#431ebe', // Royal Indigo
  secondary: '#00696b', // Deep Teal
  bg: '#faf8ff', // Soft pristine canvas
  cardBg: '#ffffff',
  border: '#e2e8f0',
  ink: '#131b2e',
  inkMuted: '#625f6e',
  tealBg: '#e6f4f4',
  saffronBg: '#fff0e8',
  danger: '#ba1a1a',
};

export function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const [pushNotifs, setPushNotifs] = useState(true);
  const [rideAlerts, setRideAlerts] = useState(true);
  const [roomMatches, setRoomMatches] = useState(true);

  const displayName = user?.user_metadata?.full_name ?? 'Community Member';
  const email = user?.email ?? 'member@manabandhu.com';
  const initial = displayName[0]?.toUpperCase() ?? 'M';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch {
      router.replace('/welcome');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.container, isDesktop && s.containerDesktop]}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <AppIcon name="chevron-left" size={20} color={C.ink} />
          </Pressable>
          <Text style={s.headerTitle}>Settings & Preferences</Text>
        </View>

        <ScrollView
          style={s.contentScroll}
          contentContainerStyle={s.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <View style={s.profileCard}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{displayName}</Text>
              <Text style={s.profileEmail}>{email}</Text>
              <View style={s.badgeRow}>
                <View style={s.trustBadge}>
                  <AppIcon name="verified-user" size={12} color={C.secondary} />
                  <Text style={s.trustBadgeText}>Verified Bandhu</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section: Notifications */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Notifications</Text>
            <View style={s.cardGroup}>
              <View style={s.settingRow}>
                <View style={s.settingLabelGroup}>
                  <Text style={s.settingLabel}>Push Notifications</Text>
                  <Text style={s.settingSub}>Important updates and community alerts</Text>
                </View>
                <Switch
                  value={pushNotifs}
                  onValueChange={setPushNotifs}
                  trackColor={{ false: '#D1D5DB', true: C.secondary }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={s.divider} />

              <View style={s.settingRow}>
                <View style={s.settingLabelGroup}>
                  <Text style={s.settingLabel}>Room & Housing Matches</Text>
                  <Text style={s.settingSub}>Instant alerts when matching rooms are posted</Text>
                </View>
                <Switch
                  value={roomMatches}
                  onValueChange={setRoomMatches}
                  trackColor={{ false: '#D1D5DB', true: C.secondary }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={s.divider} />

              <View style={s.settingRow}>
                <View style={s.settingLabelGroup}>
                  <Text style={s.settingLabel}>Carpool Ride Requests</Text>
                  <Text style={s.settingSub}>Notifications for rides along your route</Text>
                </View>
                <Switch
                  value={rideAlerts}
                  onValueChange={setRideAlerts}
                  trackColor={{ false: '#D1D5DB', true: C.secondary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>

          {/* Section: Community Safety & Trust */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Safety & Trust</Text>
            <View style={s.cardGroup}>
              <Pressable
                onPress={() => router.push('/safety')}
                style={s.linkRow}
              >
                <View style={s.linkLeft}>
                  <View style={[s.linkIconWrap, { backgroundColor: '#FEE2E2' }]}>
                    <AppIcon name="shield" size={16} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={s.linkLabel}>Emergency SOS & Safety Center</Text>
                    <Text style={s.linkSub}>Trusted contacts & emergency resources</Text>
                  </View>
                </View>
                <AppIcon name="chevron-right" size={16} color={C.inkMuted} />
              </Pressable>

              <View style={s.divider} />

              <Pressable
                onPress={() => router.push('/notifications/settings')}
                style={s.linkRow}
              >
                <View style={s.linkLeft}>
                  <View style={s.linkIconWrap}>
                    <AppIcon name="bell" size={16} color={C.secondary} />
                  </View>
                  <View>
                    <Text style={s.linkLabel}>Detailed Notification Channels</Text>
                    <Text style={s.linkSub}>SMS, email, and quiet hours configuration</Text>
                  </View>
                </View>
                <AppIcon name="chevron-right" size={16} color={C.inkMuted} />
              </Pressable>
            </View>
          </View>

          {/* Section: Support & Info */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>About & Help</Text>
            <View style={s.cardGroup}>
              <Pressable
                onPress={() => router.push('/splash')}
                style={s.linkRow}
              >
                <View style={s.linkLeft}>
                  <View style={s.linkIconWrap}>
                    <AppIcon name="help" size={16} color={C.secondary} />
                  </View>
                  <View>
                    <Text style={s.linkLabel}>Replay Welcome Introduction</Text>
                    <Text style={s.linkSub}>View the interactive feature carousel</Text>
                  </View>
                </View>
                <AppIcon name="chevron-right" size={16} color={C.inkMuted} />
              </Pressable>
            </View>
          </View>

          {/* Sign Out Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleSignOut}
            style={s.signOutBtn}
          >
            <AppIcon name="logout" size={16} color={C.danger} />
            <Text style={s.signOutText}>Sign Out of ManaBandhu</Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  containerDesktop: {
    maxWidth: 960,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.ink,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    shadowColor: '#2B3338',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
  },
  profileEmail: {
    fontSize: 13,
    color: C.inkMuted,
  },
  badgeRow: {
    marginTop: 4,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.tealBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.secondary,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  settingLabelGroup: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
  settingSub: {
    fontSize: 12,
    color: C.inkMuted,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  linkIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.ink,
  },
  linkSub: {
    fontSize: 12,
    color: C.inkMuted,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.danger,
  },
});

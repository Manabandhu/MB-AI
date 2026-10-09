import type { User } from '@supabase/supabase-js';
import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAuthStore } from '@/lib/authStore';
import type { HomeShellData } from '@/modules/foundation/homeApi';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { colors, s } from './theme';

type ProfileBadge = { label: string; icon: AppIconName; color: string; bg: string };

/**
 * Badges derived only from the signed-in Supabase user: a confirmed email or phone. No badge is shown for checks
 * the backend does not record (there is no ID verification yet).
 */
function profileBadgesFor(user: User | null): ProfileBadge[] {
  const badges: ProfileBadge[] = [];
  if (user?.email_confirmed_at) {
    badges.push({
      label: 'Email verified',
      icon: 'mail',
      color: '#00696b',
      bg: 'rgba(0,105,107,0.08)',
    });
  }
  if (user?.phone_confirmed_at) {
    badges.push({
      label: 'Phone verified',
      icon: 'phone',
      color: '#431ebe',
      bg: 'rgba(67,30,190,0.07)',
    });
  }
  return badges;
}

const profileLinks = [
  { label: 'My Listings', icon: 'home' as AppIconName, route: '/rooms' },
  { label: 'Saved Items', icon: 'heart' as AppIconName, route: '/saved' },
  { label: 'My Referrals', icon: 'community' as AppIconName, route: '/referrals/mine' },
  { label: 'My Events', icon: 'calendar' as AppIconName, route: '/events/mine' },
  { label: 'Immigration Resources', icon: 'book' as AppIconName, route: '/immigration' },
];

const profileSettings = [
  { label: 'Edit Profile', icon: 'user' as AppIconName, route: '/settings' },
  { label: 'Notification Settings', icon: 'bell' as AppIconName, route: '/notifications/settings' },
  { label: 'Privacy Settings', icon: 'shield' as AppIconName, route: '/settings' },
  { label: 'Help & Support', icon: 'help' as AppIconName, route: '/settings' },
];

export function ProfileShell({
  data,
  displayName,
}: {
  data: HomeShellData;
  displayName: string;
  isDesktop: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const name = user?.user_metadata?.full_name ?? displayName;
  const email = user?.email ?? user?.phone ?? null;
  const initial = (name?.[0] ?? 'U').toUpperCase();
  // Metrics are rendered exactly as the backend sends them; an empty list renders nothing.
  const metrics = data?.metrics ?? [];
  const badges = profileBadgesFor(user);

  return (
    <>
      <View style={s.profileHero}>
        <View style={s.profileAvatar}>
          <Text style={s.profileAvatarText}>{initial}</Text>
        </View>
        <Text style={s.profileName}>{name}</Text>
        {email ? <Text style={s.profileEmail}>{email}</Text> : null}
        <View style={s.profileLocationRow}>
          <AppIcon color="rgba(255,255,255,0.8)" name="map" size={12} />
          <Text style={s.profileLocationText}>ManaBandhu Community Member</Text>
        </View>
        {metrics.length > 0 ? (
          <View style={s.profileStats}>
            {metrics.map((stat) => (
              <View key={stat.label} style={s.profileStatItem}>
                <Text style={s.profileStatValue}>{stat.value}</Text>
                <Text style={s.profileStatLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {badges.length > 0 ? (
        <View style={s.badgesSection}>
          <Text style={s.badgesSectionTitle}>Trust Badges</Text>
          <View style={s.badgesRow}>
            {badges.map((badge) => (
              <View key={badge.label} style={[s.badge, { backgroundColor: badge.bg }]}>
                <AppIcon color={badge.color} name={badge.icon} size={16} />
                <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={s.settingsSection}>
        <Text style={s.settingsSectionTitle}>QUICK LINKS</Text>
        {profileLinks.map((link) => (
          <Link key={link.label} href={link.route as Href} asChild>
            <Pressable style={s.settingsRow} accessibilityRole="link">
              <View style={s.settingsRowLeft}>
                <View style={s.settingsIconBg}>
                  <AppIcon color={colors.appPrimary} name={link.icon} size={16} />
                </View>
                <Text style={s.settingsLabel}>{link.label}</Text>
              </View>
              <AppIcon color={colors.muted} name="chevron-right" size={16} />
            </Pressable>
          </Link>
        ))}
      </View>

      <View style={s.settingsSection}>
        <Text style={s.settingsSectionTitle}>ACCOUNT</Text>
        {profileSettings.map((setting) => (
          <Link key={setting.label} href={setting.route as Href} asChild>
            <Pressable style={s.settingsRow} accessibilityRole="link">
              <View style={s.settingsRowLeft}>
                <View style={s.settingsIconBg}>
                  <AppIcon color={colors.muted} name={setting.icon} size={16} />
                </View>
                <Text style={s.settingsLabel}>{setting.label}</Text>
              </View>
              <AppIcon color={colors.muted} name="chevron-right" size={16} />
            </Pressable>
          </Link>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => useAuthStore.getState().signOut()}
          style={[s.settingsRow, s.signOutRow]}
        >
          <View style={s.settingsRowLeft}>
            <View style={[s.settingsIconBg, { backgroundColor: 'rgba(186,26,26,0.08)' }]}>
              <AppIcon color="#ba1a1a" name="logout" size={16} />
            </View>
            <Text style={s.signOutLabel}>Sign Out</Text>
          </View>
        </Pressable>
      </View>
    </>
  );
}

// ─── SHARED SUB-COMPONENTS ────────────────────────────────────────────────────

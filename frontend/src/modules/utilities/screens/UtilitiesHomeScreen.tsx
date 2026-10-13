import { breakpoint, radius } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { getUtilitiesHome } from '@/modules/utilities/api';
import { useWindowDimensions } from '@/platform/windowDimensions';

// The hub lists only what GET /api/v1/utilities/home returns. There is no built-in service directory, ratings, or
// prices: those would be invented. Counts are not shown until the backend serves real ones per user.

const createScreenColors = (palette: ScreenPalette) => ({
  primary: palette.primary,
  primaryMuted: palette.primarySoft,
  teal: palette.teal,
  tealMuted: palette.tealBg,
  accent: palette.warm,
  accentMuted: palette.warmBg,
  emerald: palette.success,
  emeraldMuted: palette.successBg,
  bg: palette.background,
  cardBg: palette.surface,
  border: palette.border,
  ink: palette.ink,
  inkMuted: palette.muted,
});

export function UtilitiesHomeScreen() {
  const { styles: s, palette } = useScreenStyles(createScreenStyles);
  const C = createScreenColors(palette);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoint.medium;
  const [searchQuery, setSearchQuery] = useState('');

  const home = useQuery({
    queryKey: ['utilities', 'home'],
    queryFn: getUtilitiesHome,
  });

  if (home.isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <LoadingState label="Loading utilities..." />
        </View>
      </SafeAreaView>
    );
  }

  if (home.isError || !home.data) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ErrorState
            title="Unable to load utilities"
            body="Check your connection and try again."
            retryLabel="Retry"
            onRetry={() => home.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const term = searchQuery.trim().toLowerCase();
  const filtered = home.data.items.filter(
    (item) =>
      term.length === 0 ||
      item.title.toLowerCase().includes(term) ||
      item.body.toLowerCase().includes(term),
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={[s.content, isDesktop && s.contentDesktop]}>
        {/* Header */}
        <ScreenHeader
          title={home.data.title}
          subtitle="Everyday help, close to home."
          back={{ fallback: '/explore' }}
        />
        {home.data.subtitle ? <Text style={s.serviceDesc}>{home.data.subtitle}</Text> : null}

        {/* Search Bar */}
        <View style={s.searchBar}>
          <AppIcon name="search" size={18} color={C.inkMuted} />
          <TextInput
            accessibilityLabel="Search utilities"
            placeholder="Search utilities..."
            placeholderTextColor={C.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={s.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearchQuery('')}
            >
              <Text style={{ fontSize: 16, color: C.inkMuted, fontWeight: '700' }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Nav Shortcut Actions */}
        <View style={s.quickActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Packages"
            onPress={() => router.push('/utilities/packages' as Href)}
            style={s.quickActionCard}
          >
            <View style={[s.actionIconBox, { backgroundColor: C.primaryMuted }]}>
              <AppIcon name="package" size={20} color={C.primary} />
            </View>
            <Text style={s.actionLabel}>Packages</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nearby"
            onPress={() => router.push('/utilities/nearby' as Href)}
            style={s.quickActionCard}
          >
            <View style={[s.actionIconBox, { backgroundColor: C.tealMuted }]}>
              <AppIcon name="map" size={20} color={C.teal} />
            </View>
            <Text style={s.actionLabel}>Nearby Map</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Emergency"
            onPress={() => router.push('/utilities/emergency' as Href)}
            style={s.quickActionCard}
          >
            <View style={[s.actionIconBox, { backgroundColor: C.accentMuted }]}>
              <AppIcon name="warning" size={20} color={C.accent} />
            </View>
            <Text style={s.actionLabel}>Emergency</Text>
          </Pressable>
        </View>

        {/* Backend-provided entries */}
        <View style={s.servicesList}>
          {filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <AppIcon name="search" size={32} color={C.inkMuted} />
              <Text style={s.emptyTitle}>Nothing found</Text>
              <Text style={s.emptySubtitle}>
                {term.length > 0 ? 'Try a different search term.' : 'No utilities are listed yet.'}
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole={item.route ? 'button' : undefined}
                accessibilityLabel={item.title}
                disabled={!item.route}
                onPress={() => item.route && router.push(item.route as Href)}
                style={s.serviceCard}
              >
                <View style={s.cardHeader}>
                  <View style={s.cardHeaderLeft}>
                    {item.meta ? (
                      <Text style={s.categoryLabel}>{item.meta.toUpperCase()}</Text>
                    ) : null}
                    <Text style={s.serviceTitle}>{item.title}</Text>
                  </View>
                </View>
                <Text style={s.serviceDesc}>{item.body}</Text>
              </Pressable>
            ))
          )}
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
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    content: {
      padding: 16,
      paddingBottom: 48,
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
      marginBottom: 16,
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
    headerTextCol: {
      flex: 1,
    },
    locationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    locationText: {
      fontSize: 12,
      fontWeight: '700',
      color: C.teal,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: C.ink,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: C.ink,
      padding: 0,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 20,
    },
    quickActionCard: {
      minHeight: 44,
      minWidth: 44,
      flex: 1,
      backgroundColor: C.cardBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      padding: 12,
      alignItems: 'center',
      gap: 8,
    },
    actionIconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: C.ink,
    },
    featuredBanner: {
      backgroundColor: C.primary,
      borderRadius: radius.card,
      padding: 18,
      marginBottom: 20,
    },
    featuredBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginBottom: 10,
    },
    featuredBadgeText: {
      color: palette.onPrimary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    featuredTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.onPrimary,
      marginBottom: 6,
    },
    featuredDesc: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 18,
      marginBottom: 14,
    },
    featuredBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.accent,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: 'flex-start',
      gap: 6,
    },
    featuredBtnText: {
      color: palette.onPrimary,
      fontWeight: '700',
      fontSize: 13,
    },
    categoriesScroll: {
      marginBottom: 16,
    },
    categoriesContent: {
      gap: 8,
      paddingRight: 16,
    },
    categoryPill: {
      backgroundColor: C.cardBg,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    categoryPillActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    categoryPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.inkMuted,
    },
    categoryPillTextActive: {
      color: palette.onPrimary,
      fontWeight: '700',
    },
    servicesList: {
      gap: 12,
    },
    serviceCard: {
      minHeight: 44,
      minWidth: 44,
      backgroundColor: C.cardBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
      gap: 8,
    },
    cardHeaderLeft: {
      flex: 1,
    },
    categoryLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: C.teal,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    serviceTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: C.ink,
      marginBottom: 2,
    },
    providerName: {
      fontSize: 12,
      color: C.inkMuted,
    },
    badgePill: {
      backgroundColor: C.primaryMuted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    badgePillText: {
      color: C.primary,
      fontWeight: '700',
      fontSize: 11,
    },
    serviceDesc: {
      fontSize: 13,
      color: C.inkMuted,
      lineHeight: 18,
      marginBottom: 12,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: '700',
      color: C.ink,
    },
    reviewCount: {
      color: C.inkMuted,
      fontWeight: '500',
    },
    locationDot: {
      color: C.inkMuted,
      marginHorizontal: 2,
    },
    locationSmall: {
      fontSize: 11,
      color: C.inkMuted,
      flexShrink: 1,
    },
    priceTag: {
      fontSize: 13,
      fontWeight: '800',
      color: C.teal,
    },
    emptyBox: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: C.cardBg,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: C.border,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: C.ink,
    },
    emptySubtitle: {
      fontSize: 13,
      color: C.inkMuted,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: C.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 36,
      maxHeight: '85%',
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.border,
      alignSelf: 'center',
      marginBottom: 14,
    },
    modalTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    closeBtn: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: C.ink,
      marginBottom: 2,
    },
    modalProvider: {
      fontSize: 13,
      color: C.inkMuted,
      marginBottom: 16,
    },
    modalDetailsRow: {
      flexDirection: 'row',
      backgroundColor: C.bg,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    detailCol: {
      flex: 1,
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: C.inkMuted,
      marginBottom: 2,
    },
    detailVal: {
      fontSize: 12,
      fontWeight: '700',
      color: C.ink,
    },
    sectionSubtitle: {
      fontSize: 14,
      fontWeight: '700',
      color: C.ink,
      marginBottom: 6,
    },
    modalDesc: {
      fontSize: 13,
      color: C.inkMuted,
      lineHeight: 20,
      marginBottom: 20,
    },
    modalActionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    contactBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primary,
      paddingVertical: 12,
      borderRadius: 10,
      gap: 8,
    },
    contactBtnText: {
      color: palette.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    saveBtn: {
      width: 48,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: C.cardBg,
    },
  });
};

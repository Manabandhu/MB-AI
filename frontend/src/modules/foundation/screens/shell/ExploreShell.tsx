import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { HomeShellData } from '@/modules/foundation/homeApi';
import { ALL_APP_MODULES, useUserActivityStore } from '@/modules/foundation/userActivityStore';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { colors, s } from './theme';

const exploreCategories = [
  'All',
  'Living & Mobility',
  'Career & Jobs',
  'Community & Culture',
  'Desi Essentials & Safety',
];

export function ExploreShell({ data, isDesktop }: { data: HomeShellData; isDesktop: boolean }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const recordModuleVisit = useUserActivityStore((s) => s.recordModuleVisit);
  const feed = data?.feed ?? [];

  const filteredModules = ALL_APP_MODULES.filter((item) => {
    const matchesCategory =
      activeCategory === 'All' ||
      (activeCategory === 'Living & Mobility' && item.category === 'living') ||
      (activeCategory === 'Career & Jobs' && item.category === 'career') ||
      (activeCategory === 'Community & Culture' && item.category === 'community') ||
      (activeCategory === 'Desi Essentials & Safety' &&
        (item.category === 'essentials' || item.category === 'safety'));

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <View style={s.exploreHero}>
        <Text style={s.exploreHeroTitle}>Explore Capabilities</Text>
        <Text style={s.exploreHeroSub}>
          Master directory of all ManaBandhu tools, community networks, and diaspora services.
        </Text>
      </View>

      {/* Live search input */}
      <View style={s.searchBar}>
        <AppIcon color={colors.muted} name="search" size={18} />
        <TextInput
          placeholder="Filter features, services, or modules..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, fontSize: 14, color: colors.ink, padding: 0 }}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 15, color: colors.muted, fontWeight: '700' }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillRow}>
        {exploreCategories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[s.catChip, activeCategory === cat && s.catChipActive]}
          >
            <Text style={[s.catChipText, activeCategory === cat && s.catChipTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Master Modules Directory */}
      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionTitle}>All Modules & Capabilities</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted }}>
            {filteredModules.length} {filteredModules.length === 1 ? 'feature' : 'features'}
          </Text>
        </View>

        <View style={s.viewToggleContainer}>
          <Pressable
            accessibilityLabel="Switch to Grid view"
            accessibilityRole="button"
            onPress={() => setViewMode('grid')}
            style={[s.viewTogglePill, viewMode === 'grid' && s.viewTogglePillActive]}
          >
            <Text style={[s.viewToggleLabel, viewMode === 'grid' && s.viewToggleLabelActive]}>
              Grid
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Switch to List view"
            accessibilityRole="button"
            onPress={() => setViewMode('list')}
            style={[s.viewTogglePill, viewMode === 'list' && s.viewTogglePillActive]}
          >
            <Text style={[s.viewToggleLabel, viewMode === 'list' && s.viewToggleLabelActive]}>
              List
            </Text>
          </Pressable>
        </View>
      </View>

      {viewMode === 'grid' ? (
        <View style={s.exploreTileGrid}>
          {filteredModules.map((item) => (
            <Link key={item.id} href={item.route as Href} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => recordModuleVisit(item.id)}
                style={StyleSheet.flatten([
                  s.exploreTileCard,
                  isDesktop && s.exploreTileCardDesktop,
                ])}
              >
                <View style={s.exploreTileHeader}>
                  <View style={[s.exploreTileIconWrap, { backgroundColor: item.bg }]}>
                    <AppIcon color={item.iconColor} name={item.icon} size={20} />
                  </View>
                  <View style={[s.exploreTileBadge, { backgroundColor: item.bg }]}>
                    <Text style={[s.exploreTileBadgeText, { color: item.iconColor }]}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={s.exploreTileBody}>
                  <Text style={s.exploreTileTitle} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={s.exploreTileDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>

                <View style={s.exploreTileFooter}>
                  <Text style={s.exploreTileAction}>Explore</Text>
                  <AppIcon color={colors.appPrimary} name="chevron-right" size={11} />
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : (
        <View style={s.exploreHubList}>
          {filteredModules.map((item) => (
            <Link key={item.id} href={item.route as Href} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => recordModuleVisit(item.id)}
                style={s.exploreHubCard}
              >
                <View style={[s.exploreHubIcon, { backgroundColor: item.bg }]}>
                  <AppIcon color={item.iconColor} name={item.icon} size={22} />
                </View>
                <View style={s.exploreHubContent}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}
                  >
                    <Text style={s.exploreHubTitle}>{item.label}</Text>
                    <View style={[s.exploreHubBadge, { backgroundColor: item.bg }]}>
                      <Text style={[s.exploreHubBadgeText, { color: item.iconColor }]}>
                        {item.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={s.exploreHubDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
                <AppIcon color={colors.muted} name="chevron-right" size={16} />
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      {/* Community Feed / Highlights */}
      {feed.length > 0 ? (
        <>
          <View style={[s.sectionHeader, { marginTop: 24 }]}>
            <Text style={s.sectionTitle}>Trending Community Highlights</Text>
          </View>
          <View style={[s.exploreGrid, isDesktop && s.exploreGridDesktop]}>
            {feed.slice(0, 4).map((item) => (
              <Link key={item.id} href={item.route as Href} asChild>
                <Pressable
                  onPress={() =>
                    recordModuleVisit(
                      item.kind === 'room' ? 'rooms' : item.kind === 'job' ? 'jobs' : 'community',
                    )
                  }
                  style={s.exploreCard}
                >
                  <View
                    style={[
                      s.exploreCardThumb,
                      {
                        backgroundColor:
                          item.kind === 'room'
                            ? colors.indigoSoft
                            : item.kind === 'job'
                              ? colors.orangeSoft
                              : colors.tealSoft,
                      },
                    ]}
                  >
                    <Text style={s.exploreCardEmoji}>
                      {item.kind === 'room'
                        ? '🏠'
                        : item.kind === 'job'
                          ? '💼'
                          : item.kind === 'ride'
                            ? '🚗'
                            : '🎉'}
                    </Text>
                  </View>
                  <View style={s.exploreCardBody}>
                    <Text style={s.exploreCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={s.exploreCardSub} numberOfLines={1}>
                      {item.body}
                    </Text>
                    <View style={[s.exploreBadge, { backgroundColor: colors.surfaceContainer }]}>
                      <Text style={[s.exploreBadgeText, { color: colors.appPrimary }]}>
                        {item.meta}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

// ─── CHAT SHELL ───────────────────────────────────────────────────────────────

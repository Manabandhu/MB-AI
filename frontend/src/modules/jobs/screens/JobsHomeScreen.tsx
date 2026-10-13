import { formatSalaryRange } from '@manabandhu/core';
import { breakpoint, radius } from '@manabandhu/design-system';
import { useQuery } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '@/lib/authStore';
import { useLocationStore } from '@/lib/locationStore';
import { listJobPostings } from '@/modules/jobs/api';
import { useSavedJobsStore } from '@/modules/jobs/savedJobsStore';
import { listPublicReferrals } from '@/modules/referrals/api';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { type ScreenPalette, useScreenStyles } from '@/modules/shared/ui/useScreenStyles';
import { useWindowDimensions } from '@/platform/windowDimensions';

const createScreenColors = (palette: ScreenPalette) => ({
  ...palette,
  canvas: palette.surface,
  canvasMuted: palette.surfaceContainerLow,
  accentBrand: palette.primary,
  inkSecondary: palette.muted,
  borderSubtle: palette.border,
  danger: palette.error,
});

const sp = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

type FilterState = {
  keyword: string;
  location: string;
  selectedTag: string;
  category: string;
  workModel: 'all' | 'remote' | 'hybrid';
  visaAuth: 'all' | 'h1b' | 'opt' | 'greencard';
  minSalary: number;
  sortBy: 'newest' | 'salary_high' | 'salary_low';
};

const INITIAL_FILTERS: FilterState = {
  keyword: '',
  location: '',
  selectedTag: 'All',
  category: 'all',
  workModel: 'all',
  visaAuth: 'all',
  minSalary: 0,
  sortBy: 'newest',
};

const QUICK_TAGS = [
  { id: 'All', label: 'All Roles', icon: '✦' },
  { id: 'h1b', label: '⚡ H-1B Transfer OK', icon: '⚡' },
  { id: 'opt', label: '🎓 STEM OPT Friendly', icon: '🎓' },
  { id: 'referral', label: '🤝 Direct Referral', icon: '🤝' },
  { id: 'remote', label: '💻 Remote / Hybrid', icon: '💻' },
  { id: 'staff', label: '⭐ Staff / Lead SWE', icon: '⭐' },
  { id: 'austin', label: '🏢 Austin Tech Hub', icon: '🏢' },
];

export function JobsHomeScreen({ screenId }: { screenId?: string }) {
  const { styles: s, palette } = useScreenStyles(createScreenStyles);
  const colors = createScreenColors(palette);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoint.medium;
  const { session } = useAuthStore();

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const params = useLocalSearchParams<{
    keyword?: string;
    location?: string;
    workModel?: string;
  }>();
  useEffect(() => {
    if (
      params.keyword === undefined &&
      params.location === undefined &&
      params.workModel === undefined
    )
      return;
    setFilters((previous) => ({
      ...previous,
      keyword: typeof params.keyword === 'string' ? params.keyword : '',
      location: typeof params.location === 'string' ? params.location : '',
      workModel: params.workModel === 'remote' ? 'remote' : 'all',
    }));
  }, [params.keyword, params.location, params.workModel]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const globalLocation = useLocationStore((s) => s.currentLocation);
  const setGlobalLocation = useLocationStore((s) => s.setLocation);
  const selectedCity = globalLocation.name;
  const setSelectedCity = (cityName: string) => {
    setGlobalLocation({
      id: cityName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: cityName,
      cityName: cityName.split(',')[0]?.trim() || cityName,
      stateCode: cityName.split(',')[1]?.trim() || 'US',
      latitude: 30.2672,
      longitude: -97.7431,
    });
  };
  const savedIds = useSavedJobsStore((state) => state.ids);
  const savedJobs = useMemo(() => new Set(savedIds), [savedIds]);
  const toggleSaveJob = useSavedJobsStore((state) => state.toggle);

  // Fetch live jobs from Supabase via Spring Boot API
  const {
    data: rawJobs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['jobs', 'list'],
    queryFn: () => listJobPostings(0, 50),
    staleTime: 1000 * 60 * 2,
  });

  // Open referral offers come from the referrals module; the count is only shown once loaded.
  const { data: publicReferrals } = useQuery({
    queryKey: ['referrals', 'public'],
    queryFn: listPublicReferrals,
    staleTime: 1000 * 60 * 2,
  });
  const referralOfferCount = publicReferrals?.filter(
    (r) => r.type?.toLowerCase() === 'offer',
  ).length;
  const postedLastDay = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return rawJobs.filter((job) => new Date(job.createdAt).getTime() >= cutoff).length;
  }, [rawJobs]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const filteredJobs = useMemo(() => {
    return rawJobs
      .filter((job) => {
        if (screenId === 'saved' && !savedJobs.has(job.id)) return false;
        if (filters.keyword.trim()) {
          const q = filters.keyword.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCompany = (job.company || '').toLowerCase().includes(q);
          const matchDesc = (job.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCompany && !matchDesc) return false;
        }

        if (filters.location.trim()) {
          const loc = filters.location.toLowerCase();
          if (!(job.location || '').toLowerCase().includes(loc)) return false;
        }

        if (filters.selectedTag === 'h1b') {
          const text = `${job.title} ${job.description} ${job.company}`.toLowerCase();
          if (!text.includes('h-1b') && !text.includes('h1b')) return false;
        } else if (filters.selectedTag === 'opt') {
          const text = `${job.title} ${job.description}`.toLowerCase();
          if (!text.includes('opt') && !text.includes('stem')) return false;
        } else if (filters.selectedTag === 'remote') {
          if (!job.isRemote && !(job.location || '').toLowerCase().includes('remote')) return false;
        } else if (filters.selectedTag === 'staff') {
          const text = job.title.toLowerCase();
          if (!text.includes('staff') && !text.includes('lead') && !text.includes('principal'))
            return false;
        } else if (filters.selectedTag === 'austin') {
          if (!(job.location || '').toLowerCase().includes('austin')) return false;
        }

        if (filters.minSalary > 0) {
          if ((job.salaryMin || 0) < filters.minSalary) return false;
        }

        if (filters.workModel === 'remote' && !job.isRemote) return false;

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'salary_high') {
          return (b.salaryMax || b.salaryMin || 0) - (a.salaryMax || a.salaryMin || 0);
        }
        if (filters.sortBy === 'salary_low') {
          return (a.salaryMin || 0) - (b.salaryMin || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [rawJobs, filters, screenId, savedJobs]);

  return (
    <View style={s.container}>
      {/* Sticky Top Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ScreenHeader
          title={screenId === 'saved' ? 'Saved jobs' : 'Jobs'}
          subtitle={
            screenId === 'saved'
              ? 'Your job bookmarks, saved on this device.'
              : 'Opportunities shared by your community.'
          }
          back={{ fallback: '/explore' }}
          actions={
            <>
              <Chip label={selectedCity} icon="map-pin" onPress={() => setCityModalVisible(true)} />
              <IconButton
                icon="heart"
                label="Jobs saved on this device"
                onPress={() => router.push('/jobs/saved')}
              />
            </>
          }
          primaryAction={{
            label: 'Post a job',
            icon: 'plus',
            route: session ? '/jobs/post' : '/sign-in',
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBrand}
            colors={[colors.accentBrand]}
          />
        }
      >
        {/* Search Card */}
        <View style={s.searchCard}>
          <View style={s.searchInputRow}>
            <View style={s.inputContainer}>
              <Text style={s.inputIconEmoji}>🔍</Text>
              <TextInput
                value={filters.keyword}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, keyword: text }))}
                placeholder="Job title, tech stack (React, K8s, AI, Java)..."
                placeholderTextColor={colors.inkSecondary}
                style={s.textInput}
              />
            </View>

            <View style={[s.inputContainer, s.locationInput]}>
              <Text style={s.inputIconEmoji}>📍</Text>
              <TextInput
                value={filters.location}
                onChangeText={(text) => setFilters((prev) => ({ ...prev, location: text }))}
                placeholder="Austin, TX / Remote..."
                placeholderTextColor={colors.inkSecondary}
                style={s.textInput}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setFilterModalVisible(true)}
              style={s.filterTriggerBtn}
            >
              <Text style={s.filterTriggerIcon}>⚙️</Text>
              <Text style={s.filterTriggerText}>Filters</Text>
            </Pressable>
          </View>

          {/* Quick Metrics — derived from the loaded job postings and public referral offers */}
          {!isLoading && !isError ? (
            <View style={s.metricsRow}>
              <Text style={s.metricItem}>
                💼 {rawJobs.length} {rawJobs.length === 1 ? 'open role' : 'open roles'}
              </Text>
              <Text style={s.metricDivider}>•</Text>
              <Text style={s.metricItem}>⚡ {postedLastDay} posted in the last 24h</Text>
              {referralOfferCount !== undefined ? (
                <>
                  <Text style={s.metricDivider}>•</Text>
                  <Text style={s.metricItem}>
                    🤝 {referralOfferCount}{' '}
                    {referralOfferCount === 1 ? 'referral offer' : 'referral offers'}
                  </Text>
                </>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Quick Filter Tag Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsScroll}
          style={s.chipsContainer}
        >
          {QUICK_TAGS.map((tag) => {
            const isSelected = filters.selectedTag === tag.id;
            return (
              <Pressable
                accessibilityRole="button"
                key={tag.id}
                onPress={() => setFilters((prev) => ({ ...prev, selectedTag: tag.id }))}
                style={[s.chipPill, isSelected && s.chipPillActive]}
              >
                <Text style={[s.chipText, isSelected && s.chipTextActive]}>{tag.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Trust Banner */}
        <View style={s.trustBanner}>
          <View style={s.trustIconBox}>
            <Text style={s.trustEmoji}>🤝</Text>
          </View>
          <View style={s.trustContent}>
            <Text style={s.trustTitle}>Direct Community Jobs & Employee Referrals</Text>
            <Text style={s.trustSubtitle}>
              Roles and referral offers posted by community members. Review each posting and apply
              through the employer's link.
            </Text>
          </View>
        </View>

        {/* Job Listings List */}
        <View style={s.sectionHeaderRow}>
          <Text style={s.sectionTitle}>Open Roles ({filteredJobs.length})</Text>
          <Pressable accessibilityRole="button" onPress={() => setFilterModalVisible(true)}>
            <Text style={s.sortTriggerText}>Sort: {filters.sortBy.replace('_', ' ')} ▾</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={s.emptyStateBox}>
            <Text style={s.loadingText}>Loading jobs...</Text>
          </View>
        ) : isError ? (
          <View style={s.emptyStateBox}>
            <Text style={s.emptyStateEmoji}>⚠️</Text>
            <Text style={s.emptyStateTitle}>Unable to load jobs</Text>
            <Text style={s.emptyStateSubtitle}>Check your connection and try again.</Text>
            <Pressable accessibilityRole="button" onPress={() => refetch()} style={s.resetButton}>
              <Text style={s.resetButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : rawJobs.length === 0 ? (
          <View style={s.emptyStateBox}>
            <Text style={s.emptyStateEmoji}>💼</Text>
            <Text style={s.emptyStateTitle}>No jobs posted yet</Text>
            <Text style={s.emptyStateSubtitle}>
              Be the first to share an opening with the community.
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push((session ? '/jobs/post' : '/sign-in') as Href)}
              style={s.resetButton}
            >
              <Text style={s.resetButtonText}>Post Role</Text>
            </Pressable>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={s.emptyStateBox}>
            <Text style={s.emptyStateEmoji}>🔍</Text>
            <Text style={s.emptyStateTitle}>No jobs match your filter</Text>
            <Text style={s.emptyStateSubtitle}>
              Try clearing search filters or search for another technology stack.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setFilters(INITIAL_FILTERS)}
              style={s.resetButton}
            >
              <Text style={s.resetButtonText}>Reset Filters</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.jobsListGrid}>
            {filteredJobs.map((job) => {
              const isSaved = savedJobs.has(job.id);
              const salaryText =
                formatSalaryRange(job.salaryMin, job.salaryMax) ?? 'Salary not listed';

              return (
                <View key={job.id} style={s.jobCard}>
                  {/* Card Header */}
                  <View style={s.cardTopRow}>
                    <View style={s.companyRow}>
                      <View style={[s.companyAvatar, { backgroundColor: '#f0f3ff' }]}>
                        <Text style={s.companyAvatarText}>
                          {(job.company || 'C').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <View style={s.companyNameRow}>
                          <Text style={s.companyName}>{job.company || 'Company not listed'}</Text>
                        </View>
                        <Text style={s.jobLocation}>
                          📍 {job.location || (job.isRemote ? 'Remote' : 'Location not listed')}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => toggleSaveJob(job.id)}
                      style={s.cardSaveBtn}
                      accessibilityLabel={isSaved ? 'Remove job from saved' : 'Save job'}
                    >
                      <Text style={s.saveIconEmoji}>{isSaved ? '❤️' : '🤍'}</Text>
                    </Pressable>
                  </View>

                  {/* Job Title */}
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push(`/jobs/${job.id}` as Href)}
                  >
                    <Text style={s.cardTitle}>{job.title}</Text>
                  </Pressable>

                  {/* Compensation & Type Badges */}
                  <View style={s.badgeRow}>
                    <View style={s.salaryBadge}>
                      <Text style={s.salaryBadgeText}>💵 {salaryText}</Text>
                    </View>
                    {job.employmentType ? (
                      <View style={s.workTypeBadge}>
                        <Text style={s.workTypeBadgeText}>{job.employmentType}</Text>
                      </View>
                    ) : null}
                    {job.isRemote && (
                      <View style={s.remoteBadge}>
                        <Text style={s.remoteBadgeText}>🌐 Remote OK</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Actions */}
                  <View style={s.cardActionsRow}>
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => router.push(`/jobs/${job.id}` as Href)}
                      style={s.detailsActionBtn}
                    >
                      <Text style={s.detailsActionText}>View Details ↗</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="link"
                      onPress={() => {
                        if (!session) router.push('/sign-in' as Href);
                        else router.push(`/jobs/${job.id}` as Href);
                      }}
                      style={s.requestReferralBtn}
                    >
                      <Text style={s.requestReferralText}>Request Referral</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filter & Sort Modal (Responsive: bottom sheet on mobile, dialog on desktop) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType={isDesktop ? 'fade' : 'slide'}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[s.modalBackdrop, isDesktop && s.modalBackdropDesktop]}>
          <View style={[s.modalCard, isDesktop && s.modalCardDesktop]}>
            {!isDesktop && <View style={s.dragHandle} />}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Filter & Sort Jobs</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFilterModalVisible(false)}
                style={s.closeModalBtn}
              >
                <Text style={s.closeModalText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
              {/* Work Authorization */}
              <Text style={s.filterSectionTitle}>Visa & Work Authorization</Text>
              <View style={s.filterOptionRow}>
                {[
                  { id: 'all', label: 'Any Visa' },
                  { id: 'h1b', label: '⚡ H-1B Transfer' },
                  { id: 'opt', label: '🎓 STEM OPT' },
                  { id: 'greencard', label: '🌱 Green Card' },
                ].map((opt) => (
                  <Pressable
                    accessibilityRole="button"
                    key={opt.id}
                    onPress={() =>
                      setFilters((p) => ({ ...p, visaAuth: opt.id as FilterState['visaAuth'] }))
                    }
                    style={[s.filterChip, filters.visaAuth === opt.id && s.filterChipActive]}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        filters.visaAuth === opt.id && s.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Work Model */}
              <Text style={s.filterSectionTitle}>Work Model</Text>
              <View style={s.filterOptionRow}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'remote', label: '🌐 Remote' },
                  { id: 'hybrid', label: '🏢 Hybrid' },
                ].map((opt) => (
                  <Pressable
                    accessibilityRole="button"
                    key={opt.id}
                    onPress={() =>
                      setFilters((p) => ({ ...p, workModel: opt.id as FilterState['workModel'] }))
                    }
                    style={[s.filterChip, filters.workModel === opt.id && s.filterChipActive]}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        filters.workModel === opt.id && s.filterChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Minimum Salary */}
              <Text style={s.filterSectionTitle}>Minimum Salary</Text>
              <View style={s.filterOptionRow}>
                {[
                  { value: 0, label: 'Any' },
                  { value: 150000, label: '$150k+' },
                  { value: 180000, label: '$180k+' },
                  { value: 200000, label: '$200k+' },
                ].map((sal) => (
                  <Pressable
                    accessibilityRole="button"
                    key={sal.value}
                    onPress={() => setFilters((p) => ({ ...p, minSalary: sal.value }))}
                    style={[s.filterChip, filters.minSalary === sal.value && s.filterChipActive]}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        filters.minSalary === sal.value && s.filterChipTextActive,
                      ]}
                    >
                      {sal.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Sort By */}
              <Text style={s.filterSectionTitle}>Sort Order</Text>
              <View style={s.filterOptionRow}>
                {[
                  { id: 'newest', label: '⚡ Newest First' },
                  { id: 'salary_high', label: '💵 Highest Salary' },
                  { id: 'salary_low', label: '📉 Lowest Salary' },
                ].map((sOpt) => (
                  <Pressable
                    accessibilityRole="button"
                    key={sOpt.id}
                    onPress={() =>
                      setFilters((p) => ({ ...p, sortBy: sOpt.id as FilterState['sortBy'] }))
                    }
                    style={[s.filterChip, filters.sortBy === sOpt.id && s.filterChipActive]}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        filters.sortBy === sOpt.id && s.filterChipTextActive,
                      ]}
                    >
                      {sOpt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={s.modalFooter}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFilters(INITIAL_FILTERS)}
                style={s.modalResetBtn}
              >
                <Text style={s.modalResetText}>Reset All</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFilterModalVisible(false)}
                style={s.modalApplyBtn}
              >
                <Text style={s.modalApplyText}>Show {filteredJobs.length} Roles</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* City Selector Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={[s.modalBackdrop, s.modalBackdropDesktop]}>
          <View style={[s.modalCard, s.modalCardDesktop]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Tech Hub</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCityModalVisible(false)}
                style={s.closeModalBtn}
              >
                <Text style={s.closeModalText}>✕</Text>
              </Pressable>
            </View>
            <View style={s.cityList}>
              {[
                { name: 'Austin & Bay Area', desc: 'Apple Riata, Google Hub, Silicon Valley' },
                { name: 'Austin, TX', desc: 'Domain, Downtown, Riata, Giga Texas' },
                { name: 'Bay Area, CA', desc: 'San Jose, Mountain View, San Francisco' },
                { name: 'Seattle, WA', desc: 'Bellevue, Redmond, Amazon HQ' },
                { name: 'DFW, TX', desc: 'Plano, Frisco, Irving Tech Corridor' },
              ].map((hub) => (
                <Pressable
                  accessibilityRole="button"
                  key={hub.name}
                  onPress={() => {
                    setSelectedCity(hub.name);
                    setCityModalVisible(false);
                  }}
                  style={[s.cityOption, selectedCity === hub.name && s.cityOptionActive]}
                >
                  <View>
                    <Text style={s.cityName}>{hub.name}</Text>
                    <Text style={s.cityDesc}>{hub.desc}</Text>
                  </View>
                  {selectedCity === hub.name && <Text style={s.cityCheck}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createScreenStyles = (palette: ScreenPalette) => {
  const colors = createScreenColors(palette);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fe',
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
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
    },
    brandBadge: {
      width: 44,
      height: 44,
      borderRadius: radius.card,
      backgroundColor: '#f3e8ff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandLogoEmoji: {
      fontSize: 24,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.sm,
    },
    appTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.5,
    },
    categoryPill: {
      backgroundColor: '#ede9fe',
      paddingHorizontal: sp.xs,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    categoryPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accentBrand,
      letterSpacing: 0.5,
    },
    citySelectorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    citySelectorText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.inkSecondary,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.canvasMuted,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    iconButtonEmoji: {
      fontSize: 18,
    },
    savedBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.danger,
      borderRadius: 999,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    savedBadgeText: {
      color: colors.canvas,
      fontSize: 10,
      fontWeight: '700',
    },
    postButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accentBrand,
      paddingHorizontal: sp.md,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    postButtonText: {
      color: colors.canvas,
      fontSize: 13,
      fontWeight: '700',
    },
    scrollContent: {
      padding: sp.lg,
      paddingBottom: sp.xxl * 2,
    },
    searchCard: {
      backgroundColor: colors.canvas,
      borderRadius: radius.card,
      padding: sp.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      marginBottom: sp.md,
    },
    searchInputRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sp.sm,
    },
    inputContainer: {
      flex: 1,
      minWidth: 200,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.canvasMuted,
      borderRadius: radius.control,
      paddingHorizontal: sp.sm,
      height: 44,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    locationInput: {
      maxWidth: 220,
    },
    inputIconEmoji: {
      fontSize: 16,
      marginRight: 6,
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: colors.ink,
    },
    filterTriggerBtn: {
      minHeight: 44,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#ede9fe',
      paddingHorizontal: sp.md,
      borderRadius: radius.control,
      height: 44,
    },
    filterTriggerIcon: {
      fontSize: 14,
    },
    filterTriggerText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accentBrand,
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: sp.xs,
      marginTop: sp.sm,
      paddingTop: sp.xs,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    metricItem: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.inkSecondary,
    },
    metricDivider: {
      fontSize: 11,
      color: colors.border,
    },
    chipsContainer: {
      marginBottom: sp.md,
    },
    chipsScroll: {
      gap: sp.sm,
    },
    chipPill: {
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: sp.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    chipPillActive: {
      backgroundColor: colors.accentBrand,
      borderColor: colors.accentBrand,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.inkSecondary,
    },
    chipTextActive: {
      color: colors.canvas,
      fontWeight: '700',
    },
    trustBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
      backgroundColor: '#eef2ff',
      borderRadius: radius.card,
      padding: sp.md,
      marginBottom: sp.lg,
      borderWidth: 1,
      borderColor: '#c7d2fe',
    },
    trustIconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.control,
      backgroundColor: colors.canvas,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trustEmoji: {
      fontSize: 22,
    },
    trustContent: {
      flex: 1,
    },
    trustTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#312e81',
      marginBottom: 2,
    },
    trustSubtitle: {
      fontSize: 11,
      color: '#4338ca',
      lineHeight: 16,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: sp.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.3,
    },
    sortTriggerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accentBrand,
    },
    emptyStateBox: {
      backgroundColor: colors.canvas,
      borderRadius: radius.card,
      padding: sp.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.inkSecondary,
    },
    emptyStateEmoji: {
      fontSize: 40,
      marginBottom: sp.sm,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 4,
    },
    emptyStateSubtitle: {
      fontSize: 12,
      color: colors.inkSecondary,
      textAlign: 'center',
      marginBottom: sp.md,
    },
    resetButton: {
      minHeight: 44,
      minWidth: 44,
      backgroundColor: colors.accentBrand,
      paddingHorizontal: sp.lg,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    resetButtonText: {
      color: colors.canvas,
      fontSize: 12,
      fontWeight: '700',
    },
    jobsListGrid: {
      gap: sp.md,
    },
    jobCard: {
      backgroundColor: colors.canvas,
      borderRadius: radius.card,
      padding: sp.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: sp.sm,
    },
    companyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.sm,
    },
    companyAvatar: {
      width: 42,
      height: 42,
      borderRadius: radius.control,
      alignItems: 'center',
      justifyContent: 'center',
    },
    companyAvatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accentBrand,
    },
    companyNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    companyName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    jobLocation: {
      fontSize: 12,
      color: colors.inkSecondary,
      marginTop: 1,
    },
    cardSaveBtn: { minHeight: 44, minWidth: 44, padding: 4 },
    saveIconEmoji: {
      fontSize: 18,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.ink,
      letterSpacing: -0.4,
      marginBottom: sp.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: sp.xs,
      marginBottom: sp.sm,
    },
    salaryBadge: {
      backgroundColor: '#ecfdf5',
      paddingHorizontal: sp.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: '#a7f3d0',
    },
    salaryBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#065f46',
    },
    workTypeBadge: {
      backgroundColor: colors.canvasMuted,
      paddingHorizontal: sp.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    workTypeBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.inkSecondary,
    },
    remoteBadge: {
      backgroundColor: '#eff6ff',
      paddingHorizontal: sp.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: '#bfdbfe',
    },
    remoteBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#1e40af',
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.sm,
    },
    detailsActionBtn: {
      minHeight: 44,
      minWidth: 44,
      flex: 1,
      height: 42,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.canvas,
    },
    detailsActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
    },
    requestReferralBtn: {
      minHeight: 44,
      minWidth: 44,
      flex: 1.5,
      height: 42,
      borderRadius: radius.control,
      backgroundColor: colors.accentBrand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    requestReferralText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.canvas,
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
      width: 540,
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
      fontSize: 18,
      fontWeight: '800',
      color: colors.ink,
    },
    closeModalBtn: { minHeight: 44, minWidth: 44, padding: 4 },
    closeModalText: {
      fontSize: 16,
      color: colors.inkSecondary,
      fontWeight: '700',
    },
    modalBody: {
      marginBottom: sp.md,
    },
    filterSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      marginTop: sp.sm,
      marginBottom: sp.xs,
    },
    filterOptionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: sp.sm,
    },
    filterChip: {
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: sp.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.canvasMuted,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    filterChipActive: {
      backgroundColor: colors.accentBrand,
      borderColor: colors.accentBrand,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.inkSecondary,
    },
    filterChipTextActive: {
      color: colors.canvas,
      fontWeight: '700',
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp.md,
      paddingTop: sp.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    modalResetBtn: {
      minHeight: 44,
      minWidth: 44,
      flex: 1,
      height: 44,
      borderRadius: radius.control,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalResetText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.inkSecondary,
    },
    modalApplyBtn: {
      minHeight: 44,
      minWidth: 44,
      flex: 2,
      height: 44,
      borderRadius: radius.control,
      backgroundColor: colors.accentBrand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalApplyText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.canvas,
    },
    cityList: {
      gap: sp.sm,
    },
    cityOption: {
      minHeight: 44,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: sp.md,
      borderRadius: radius.control,
      backgroundColor: colors.canvasMuted,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    cityOptionActive: {
      backgroundColor: '#ede9fe',
      borderColor: colors.accentBrand,
    },
    cityName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    cityDesc: {
      fontSize: 11,
      color: colors.inkSecondary,
      marginTop: 2,
    },
    cityCheck: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accentBrand,
    },
  });
};

export { JobsHomeScreen as JobsScreen };

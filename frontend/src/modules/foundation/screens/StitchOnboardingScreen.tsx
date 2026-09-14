import { color as baseColors, space } from '@manabandhu/design-system';
import { type Href, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useCompleteOnboarding,
  useOnboardingConfig,
  useOnboardingProgress,
  useSaveOnboardingStep,
} from '@/modules/foundation/onboardingApi';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  primary: '#431ebe',
  primarySoft: '#e5deff',
  primaryContainer: '#5b3fd6',
  surface: '#ffffff',
  background: '#faf8ff',
  ink: '#131b2e',
  muted: '#625f6e',
  teal: '#00696b',
  warm: '#ff7e33',
  border: '#e2e8f0',
  surfaceContainerLow: '#f4f2fb',
  surfaceContainerHigh: '#e8e4f5',
  skeleton: '#e5deff',
};

export type OnboardingStepKey =
  | 'about'
  | 'goals'
  | 'reason'
  | 'what-brings-you-here'
  | 'location'
  | 'languages'
  | 'interests'
  | 'photo'
  | 'profile-photo'
  | 'profile_photo'
  | 'notifications'
  | 'trust'
  | 'trust_safety'
  | 'trust-and-safety'
  | 'complete';

interface StepMeta {
  index: number;
  key: string;
  route: string;
  prevRoute: string;
  nextRoute: string;
}

const STEP_METAS: Record<string, StepMeta> = {
  goals: {
    index: 1,
    key: 'goals',
    route: '/onboarding/what-brings-you-here',
    prevRoute: '/welcome',
    nextRoute: '/onboarding/location',
  },
  location: {
    index: 2,
    key: 'location',
    route: '/onboarding/location',
    prevRoute: '/onboarding/what-brings-you-here',
    nextRoute: '/onboarding/languages',
  },
  languages: {
    index: 3,
    key: 'languages',
    route: '/onboarding/languages',
    prevRoute: '/onboarding/location',
    nextRoute: '/onboarding/interests',
  },
  interests: {
    index: 4,
    key: 'interests',
    route: '/onboarding/interests',
    prevRoute: '/onboarding/languages',
    nextRoute: '/onboarding/profile-photo',
  },
  'profile-photo': {
    index: 5,
    key: 'profile-photo',
    route: '/onboarding/profile-photo',
    prevRoute: '/onboarding/interests',
    nextRoute: '/onboarding/notifications',
  },
  notifications: {
    index: 6,
    key: 'notifications',
    route: '/onboarding/notifications',
    prevRoute: '/onboarding/profile-photo',
    nextRoute: '/onboarding/trust-and-safety',
  },
  'trust-and-safety': {
    index: 7,
    key: 'trust_safety',
    route: '/onboarding/trust-and-safety',
    prevRoute: '/onboarding/notifications',
    nextRoute: '/onboarding/complete',
  },
  complete: {
    index: 8,
    key: 'complete',
    route: '/onboarding/complete',
    prevRoute: '/onboarding/trust-and-safety',
    nextRoute: '/home',
  },
};

function normalizeStepKey(rawKey: string): string {
  if (rawKey === 'reason' || rawKey === 'what-brings-you-here') return 'goals';
  if (rawKey === 'photo' || rawKey === 'profile_photo') return 'profile-photo';
  if (rawKey === 'trust' || rawKey === 'trust_safety') return 'trust-and-safety';
  return rawKey;
}

function resolveAppIcon(iconName?: string | null): AppIconName {
  if (!iconName) return 'star';
  const name = iconName.toLowerCase();
  if (name.includes('home') || name.includes('room')) return 'home';
  if (name.includes('car') || name.includes('ride')) return 'car';
  if (name.includes('briefcase') || name.includes('job') || name.includes('career'))
    return 'briefcase';
  if (name.includes('shop') || name.includes('market') || name.includes('bag'))
    return 'marketplace';
  if (name.includes('calendar') || name.includes('event')) return 'calendar';
  if (
    name.includes('shield') ||
    name.includes('safe') ||
    name.includes('trust') ||
    name.includes('legal')
  )
    return 'shield';
  if (name.includes('bell') || name.includes('alert') || name.includes('notice')) return 'bell';
  if (name.includes('message') || name.includes('chat')) return 'message';
  if (name.includes('search')) return 'search';
  if (name.includes('user') || name.includes('avatar')) return 'user';
  if (name.includes('globe') || name.includes('lang')) return 'globe';
  return 'star';
}

export function StitchOnboardingScreen({ kind }: { kind: OnboardingStepKey }) {
  const normalizedKey = normalizeStepKey(kind);
  const meta = STEP_METAS[normalizedKey] || STEP_METAS.goals;

  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useOnboardingConfig();
  const { data: progress } = useOnboardingProgress();
  const saveStepMutation = useSaveOnboardingStep();
  const completeMutation = useCompleteOnboarding();

  // Local editable state populated from persisted user progress
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [metroLocation, setMetroLocation] = useState<string>('');
  const [universityCampus, setUniversityCampus] = useState<string>('');
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('telugu');
  const [secondaryLanguages, setSecondaryLanguages] = useState<string[]>([]);
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, boolean>>({
    emergency_sos: true,
    ride_matches: true,
    room_openings: true,
    chat_messages: true,
  });
  const [pledgesAccepted, setPledgesAccepted] = useState<Record<string, boolean>>({
    verified_identity: false,
    no_scams: false,
    mutual_respect: false,
  });

  // Sync with loaded progress
  useEffect(() => {
    if (progress) {
      if (progress.selectedReasons?.length) setSelectedReasons(progress.selectedReasons);
      if (progress.metroLocation) setMetroLocation(progress.metroLocation);
      if (progress.universityCampus) setUniversityCampus(progress.universityCampus);
      if (progress.primaryLanguage) setPrimaryLanguage(progress.primaryLanguage);
      if (progress.secondaryLanguages?.length) setSecondaryLanguages(progress.secondaryLanguages);
      if (progress.interestTags?.length) setInterestTags(progress.interestTags);
      if (progress.bio) setBio(progress.bio);
      if (progress.avatarUrl) setAvatarUrl(progress.avatarUrl);
      if (
        progress.notificationPreferences &&
        Object.keys(progress.notificationPreferences).length
      ) {
        const booleanPrefs: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(progress.notificationPreferences)) {
          booleanPrefs[k] = Boolean(v);
        }
        setNotificationPreferences((prev) => ({ ...prev, ...booleanPrefs }));
      }
      if (progress.safetyPledgeAccepted) {
        setPledgesAccepted({
          verified_identity: true,
          no_scams: true,
          mutual_respect: true,
        });
      }
    }
  }, [progress]);

  // Find step config from DB
  const stepConfig = useMemo(() => {
    if (!config?.steps) return null;
    const lookupKey = meta.key;
    return config.steps.find((s) => s.stepKey === lookupKey) || null;
  }, [config, meta.key]);

  // Progress bar percentage (1 of 8 = 12.5%, 8 of 8 = 100%)
  const progressPercent = useMemo(() => {
    return Math.min(Math.max((meta.index / 8) * 100, 10), 100);
  }, [meta.index]);

  const handleNext = async () => {
    if (saveStepMutation.isPending || completeMutation.isPending) return;

    if (meta.index === 8) {
      // Step 8: Complete
      await completeMutation.mutateAsync();
      router.replace('/home');
      return;
    }

    // Prepare payload depending on current step
    let payload: Record<string, unknown> = {};
    if (meta.key === 'goals') {
      payload = { selectedReasons };
    } else if (meta.key === 'location') {
      payload = { metroLocation, universityCampus };
    } else if (meta.key === 'languages') {
      payload = { primaryLanguage, secondaryLanguages };
    } else if (meta.key === 'interests') {
      payload = { interestTags };
    } else if (meta.key === 'profile-photo') {
      payload = { bio, avatarUrl };
    } else if (meta.key === 'notifications') {
      payload = { notificationPreferences };
    } else if (meta.key === 'trust_safety') {
      const allAccepted = Object.values(pledgesAccepted).every(Boolean);
      payload = { safetyPledgeAccepted: allAccepted };
    }

    try {
      await saveStepMutation.mutateAsync({
        stepKey: meta.key,
        payload,
      });
    } catch (err) {
      console.warn('Failed to save step to DB, continuing to next route:', err);
    }

    router.push(meta.nextRoute as Href);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(meta.prevRoute as Href);
    }
  };

  const handleSkip = () => {
    router.push(meta.nextRoute as Href);
  };

  // Loading skeleton state
  if (isConfigLoading && !config) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Setting up your community experience...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (configError && !config) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <AppIcon color={colors.warm} name="warning" size={40} />
          <Text style={styles.errorTitle}>Unable to load onboarding</Text>
          <Text style={styles.errorSub}>Please check your connection and try again.</Text>
          <View style={{ marginTop: space.x4, width: 200 }}>
            <AppButton label="Retry" onPress={() => refetchConfig()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.adaptiveWrapper}>
        {/* Top App Bar & Progress Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleBack}
              style={styles.backButton}
            >
              <AppIcon color={colors.ink} name="chevron-left" size={24} />
            </Pressable>

            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Step {meta.index} of 8</Text>
            </View>

            {meta.index < 8 ? (
              <Pressable
                accessibilityLabel="Skip this step"
                accessibilityRole="button"
                hitSlop={8}
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          {/* Progress track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Scrollable Content Body */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Headline & Subtitle */}
          <View style={styles.headlineGroup}>
            <View style={styles.categoryPill}>
              <AppIcon color={colors.primary} name="sparks" size={14} />
              <Text style={styles.categoryPillText}>PERSONALIZED SETUP</Text>
            </View>
            <Text style={styles.titleText}>
              {stepConfig?.title ||
                (meta.index === 8 ? 'You’re All Set!' : 'Welcome to ManaBandhu')}
            </Text>
            {stepConfig?.subtitle ? (
              <Text style={styles.subtitleText}>{stepConfig.subtitle}</Text>
            ) : null}
          </View>

          {/* STEP 1: GOALS / REASONS */}
          {meta.index === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.instructionBanner}>
                <Text style={styles.instructionText}>
                  Select one or more goals to tailor your discovery feed
                </Text>
                <Text style={styles.countBadgeText}>{selectedReasons.length} selected</Text>
              </View>

              <View style={styles.cardGrid}>
                {stepConfig?.options.map((opt) => {
                  const isSelected = selectedReasons.includes(opt.optionKey);
                  return (
                    <Pressable
                      key={opt.optionKey}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => {
                        setSelectedReasons((prev) =>
                          isSelected
                            ? prev.filter((k) => k !== opt.optionKey)
                            : [...prev, opt.optionKey],
                        );
                      }}
                      style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    >
                      <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                        <AppIcon
                          color={isSelected ? colors.surface : colors.primary}
                          name={resolveAppIcon(opt.iconName)}
                          size={22}
                        />
                      </View>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                        {opt.label}
                      </Text>
                      {opt.description ? (
                        <Text style={styles.cardDescription}>{opt.description}</Text>
                      ) : null}
                      {isSelected ? (
                        <View style={styles.checkmarkBadge}>
                          <AppIcon color={colors.surface} name="check" size={12} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.reassuranceCard}>
                <AppIcon color={colors.teal} name="shield" size={18} />
                <Text style={styles.reassuranceText}>
                  You can change these anytime in your Profile & Discovery settings.
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: LOCATION */}
          {meta.index === 2 && (
            <View style={styles.stepContainer}>
              {/* GPS Banner */}
              <Pressable
                onPress={() => setMetroLocation('Dallas–Fort Worth / Coppell / Irving, TX')}
                style={styles.gpsBanner}
              >
                <View style={styles.gpsIconCircle}>
                  <AppIcon color={colors.teal} name="compass" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsBannerTitle}>Use current location</Text>
                  <Text style={styles.gpsBannerSub}>Auto-detect metro & university cluster</Text>
                </View>
                <AppIcon color={colors.muted} name="chevron-right" size={18} />
              </Pressable>

              {/* Search Bar */}
              <View style={styles.searchBar}>
                <AppIcon color={colors.muted} name="search" size={18} />
                <TextInput
                  onChangeText={setSearchLocationQuery}
                  placeholder="Search city, zip code, or neighborhood..."
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  value={searchLocationQuery}
                />
              </View>

              {/* Popular Diaspora Metro Hubs */}
              <Text style={styles.sectionHeader}>Key Diaspora Metro Hubs</Text>
              <View style={styles.metroGrid}>
                {stepConfig?.options
                  .filter((opt) =>
                    searchLocationQuery
                      ? opt.label.toLowerCase().includes(searchLocationQuery.toLowerCase())
                      : true,
                  )
                  .map((opt) => {
                    const isSelected =
                      metroLocation === opt.label || metroLocation === opt.optionKey;
                    return (
                      <Pressable
                        key={opt.optionKey}
                        onPress={() => setMetroLocation(opt.label)}
                        style={[styles.metroCard, isSelected && styles.metroCardSelected]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.metroCardTitle,
                              isSelected && styles.metroCardTitleSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {opt.description ? (
                            <Text style={styles.metroCardSub}>{opt.description}</Text>
                          ) : null}
                        </View>
                        {isSelected && (
                          <View style={styles.metroCheck}>
                            <AppIcon color={colors.surface} name="check" size={14} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
              </View>

              {/* University Campus Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>University or College Campus (Optional)</Text>
                <TextInput
                  onChangeText={setUniversityCampus}
                  placeholder="e.g. UT Dallas, UT Austin, San Jose State, UIC..."
                  placeholderTextColor={colors.muted}
                  style={styles.textInput}
                  value={universityCampus}
                />
              </View>
            </View>
          )}

          {/* STEP 3: LANGUAGES */}
          {meta.index === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.sectionHeader}>Primary Language</Text>
              <Text style={styles.helperText}>
                Choose the language you are most comfortable communicating in
              </Text>
              <View style={styles.chipsWrap}>
                {stepConfig?.options.map((opt) => {
                  const isPrimary = primaryLanguage === opt.optionKey;
                  return (
                    <Pressable
                      key={opt.optionKey}
                      onPress={() => setPrimaryLanguage(opt.optionKey)}
                      style={[styles.langChip, isPrimary && styles.langChipPrimary]}
                    >
                      <Text style={[styles.langChipText, isPrimary && styles.langChipTextPrimary]}>
                        {opt.label}
                      </Text>
                      {isPrimary && <AppIcon color={colors.surface} name="check" size={14} />}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionHeader, { marginTop: space.x6 }]}>
                Other Languages You Understand
              </Text>
              <Text style={styles.helperText}>
                Connect with neighbors across diverse communities
              </Text>
              <View style={styles.chipsWrap}>
                {stepConfig?.options
                  .filter((opt) => opt.optionKey !== primaryLanguage)
                  .map((opt) => {
                    const isSelected = secondaryLanguages.includes(opt.optionKey);
                    return (
                      <Pressable
                        key={opt.optionKey}
                        onPress={() => {
                          setSecondaryLanguages((prev) =>
                            isSelected
                              ? prev.filter((k) => k !== opt.optionKey)
                              : [...prev, opt.optionKey],
                          );
                        }}
                        style={[styles.langChip, isSelected && styles.langChipSelected]}
                      >
                        <Text
                          style={[styles.langChipText, isSelected && styles.langChipTextSelected]}
                        >
                          {opt.label}
                        </Text>
                        {isSelected && <AppIcon color={colors.surface} name="check" size={14} />}
                      </Pressable>
                    );
                  })}
              </View>
            </View>
          )}

          {/* STEP 4: INTERESTS */}
          {meta.index === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.chipsWrap}>
                {stepConfig?.options.map((opt) => {
                  const isSelected = interestTags.includes(opt.optionKey);
                  return (
                    <Pressable
                      key={opt.optionKey}
                      onPress={() => {
                        setInterestTags((prev) =>
                          isSelected
                            ? prev.filter((k) => k !== opt.optionKey)
                            : [...prev, opt.optionKey],
                        );
                      }}
                      style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                    >
                      <AppIcon
                        color={isSelected ? colors.surface : colors.primary}
                        name={resolveAppIcon(opt.category)}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.interestChipText,
                          isSelected && styles.interestChipTextSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected && <AppIcon color={colors.surface} name="check" size={12} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 5: PROFILE PHOTO & BIO */}
          {meta.index === 5 && (
            <View style={styles.stepContainer}>
              <View style={styles.photoContainer}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>MB</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    // Demo avatar toggle
                    setAvatarUrl((prev) =>
                      prev
                        ? ''
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                    );
                  }}
                  style={styles.cameraBadge}
                >
                  <AppIcon color={colors.surface} name="user" size={18} />
                </Pressable>
              </View>
              <Text style={styles.photoHint}>
                A friendly photo helps roommates and carpool partners recognize you
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Short 1-line Bio (Optional)</Text>
                <TextInput
                  maxLength={160}
                  multiline
                  numberOfLines={2}
                  onChangeText={setBio}
                  placeholder="e.g., Software engineer in Irving, foodie, weekend badminton player..."
                  placeholderTextColor={colors.muted}
                  style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
                  value={bio}
                />
              </View>
            </View>
          )}

          {/* STEP 6: NOTIFICATIONS */}
          {meta.index === 6 && (
            <View style={styles.stepContainer}>
              <View style={styles.notificationList}>
                {stepConfig?.options.map((opt) => {
                  const isEnabled = !!notificationPreferences[opt.optionKey];
                  return (
                    <View key={opt.optionKey} style={styles.notificationRow}>
                      <View style={styles.notificationIconBox}>
                        <AppIcon
                          color={colors.primary}
                          name={resolveAppIcon(opt.iconName || opt.category)}
                          size={20}
                        />
                      </View>
                      <View style={{ flex: 1, paddingRight: space.x2 }}>
                        <Text style={styles.notificationTitle}>{opt.label}</Text>
                        {opt.description ? (
                          <Text style={styles.notificationDesc}>{opt.description}</Text>
                        ) : null}
                      </View>
                      <Switch
                        onValueChange={(val) => {
                          setNotificationPreferences((prev) => ({
                            ...prev,
                            [opt.optionKey]: val,
                          }));
                        }}
                        thumbColor={Platform.OS === 'android' ? colors.surface : undefined}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        value={isEnabled}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 7: TRUST & SAFETY PLEDGE */}
          {meta.index === 7 && (
            <View style={styles.stepContainer}>
              <View style={styles.pledgeHero}>
                <View style={styles.shieldBigBox}>
                  <AppIcon color={colors.teal} name="shield" size={32} />
                </View>
                <Text style={styles.pledgeHeroTitle}>Our Verified Community Trust Code</Text>
                <Text style={styles.pledgeHeroSub}>
                  ManaBandhu is a safe haven built on mutual accountability, authentic identities,
                  and zero exploitation.
                </Text>
              </View>

              <View style={styles.pledgeList}>
                {stepConfig?.options.map((opt) => {
                  const isChecked = !!pledgesAccepted[opt.optionKey];
                  return (
                    <Pressable
                      key={opt.optionKey}
                      onPress={() => {
                        setPledgesAccepted((prev) => ({
                          ...prev,
                          [opt.optionKey]: !isChecked,
                        }));
                      }}
                      style={[styles.pledgeCard, isChecked && styles.pledgeCardChecked]}
                    >
                      <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                        {isChecked && <AppIcon color={colors.surface} name="check" size={14} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pledgeLabel}>{opt.label}</Text>
                        {opt.description ? (
                          <Text style={styles.pledgeDesc}>{opt.description}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Master Accept Button */}
              <Pressable
                onPress={() => {
                  const allTrue: Record<string, boolean> = {};
                  stepConfig?.options.forEach((opt) => {
                    allTrue[opt.optionKey] = true;
                  });
                  setPledgesAccepted(allTrue);
                }}
                style={styles.masterPledgeBtn}
              >
                <AppIcon color={colors.primary} name="check" size={16} />
                <Text style={styles.masterPledgeBtnText}>Accept All Community Guidelines</Text>
              </Pressable>
            </View>
          )}

          {/* STEP 8: COMPLETE */}
          {meta.index === 8 && (
            <View style={styles.stepContainer}>
              <View style={styles.celebrationHero}>
                <View style={styles.sparkleCircle}>
                  <AppIcon color={colors.warm} name="sparks" size={36} />
                </View>
                <Text style={styles.celebrateTitle}>Welcome to the ManaBandhu Family!</Text>
                <Text style={styles.celebrateSub}>
                  Your preferences are stored securely. You now have full verified access to rooms,
                  rides, job referrals, and local events.
                </Text>

                {/* Welcome bonus badge */}
                <View style={styles.bonusBadge}>
                  <AppIcon color={colors.teal} name="star" size={16} />
                  <Text style={styles.bonusBadgeText}>+50 Welcome Community Credits Awarded</Text>
                </View>
              </View>

              {/* Personalized Profile Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Your Personalized Profile</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Metro Area</Text>
                  <Text style={styles.summaryValue}>{metroLocation || 'DFW / Coppell, TX'}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Primary Language</Text>
                  <Text style={styles.summaryValue}>
                    {primaryLanguage.toUpperCase() || 'TELUGU'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Top Goals</Text>
                  <Text style={styles.summaryValue}>
                    {selectedReasons.length
                      ? `${selectedReasons.length} goals selected`
                      : 'Housing, Rides, Jobs'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Community Interests</Text>
                  <Text style={styles.summaryValue}>
                    {interestTags.length
                      ? `${interestTags.length} topics picked`
                      : 'Subleases, Carpool, Tech'}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trust Pledge</Text>
                  <Text style={[styles.summaryValue, { color: colors.teal }]}>
                    ✓ Verified & Agreed
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Docked Sticky Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <AppButton
            disabled={saveStepMutation.isPending || completeMutation.isPending}
            icon={meta.index === 8 ? 'home' : 'chevron-right'}
            label={
              saveStepMutation.isPending || completeMutation.isPending
                ? 'Saving...'
                : meta.index === 8
                  ? 'Explore ManaBandhu →'
                  : 'Continue'
            }
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  adaptiveWrapper: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    maxWidth: 640,
    width: '100%',
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: space.x6,
  },
  loadingText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    marginTop: space.x4,
  },
  errorTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: space.x4,
  },
  errorSub: {
    color: colors.muted,
    fontSize: 14,
    marginTop: space.x2,
    textAlign: 'center',
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: space.x4,
    paddingTop: space.x2,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  stepBadge: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: space.x3,
    paddingVertical: space.x1,
  },
  stepBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: space.x2,
    paddingVertical: space.x1,
  },
  skipText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    height: 5,
    marginVertical: space.x2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingHorizontal: space.x4,
    paddingTop: space.x5,
  },
  headlineGroup: {
    marginBottom: space.x5,
  },
  categoryPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    flexDirection: 'row',
    gap: space.x1,
    marginBottom: space.x2,
    paddingHorizontal: space.x2,
    paddingVertical: 3,
  },
  categoryPillText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleText: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  subtitleText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: space.x2,
  },
  stepContainer: {
    gap: space.x4,
  },
  instructionBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.x1,
  },
  instructionText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  countBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x3,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: space.x4,
    position: 'relative',
    width: '48%',
  },
  goalCardSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginBottom: space.x3,
    width: 44,
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: space.x1,
  },
  cardTitleSelected: {
    color: colors.primary,
  },
  cardDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  checkmarkBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 20,
  },
  reassuranceCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    flexDirection: 'row',
    gap: space.x3,
    marginTop: space.x3,
    padding: space.x3,
  },
  reassuranceText: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  gpsBanner: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x4,
  },
  gpsIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  gpsBannerTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  gpsBannerSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    height: 48,
    paddingHorizontal: space.x3,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  sectionHeader: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: space.x2,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  metroGrid: {
    gap: space.x2,
  },
  metroCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: space.x3,
  },
  metroCardSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  metroCardTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  metroCardTitleSelected: {
    color: colors.primary,
  },
  metroCardSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  metroCheck: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  inputGroup: {
    gap: space.x2,
    marginTop: space.x2,
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    minHeight: 48,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.x2,
  },
  langChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  langChipPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langChipSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  langChipText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  langChipTextPrimary: {
    color: colors.surface,
  },
  langChipTextSelected: {
    color: colors.surface,
  },
  interestChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  interestChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  interestChipText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  interestChipTextSelected: {
    color: colors.surface,
  },
  photoContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: space.x4,
    position: 'relative',
  },
  avatarImage: {
    borderRadius: 60,
    height: 120,
    width: 120,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    width: 120,
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: '800',
  },
  cameraBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    bottom: 0,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 36,
  },
  photoHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  notificationList: {
    gap: space.x3,
  },
  notificationRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: space.x3,
  },
  notificationIconBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    marginRight: space.x3,
    width: 40,
  },
  notificationTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  notificationDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  pledgeHero: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: space.x4,
    textAlign: 'center',
  },
  shieldBigBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: space.x2,
    width: 64,
  },
  pledgeHeroTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  pledgeHeroSub: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: space.x1,
    textAlign: 'center',
  },
  pledgeList: {
    gap: space.x3,
    marginTop: space.x2,
  },
  pledgeCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x3,
    padding: space.x3,
  },
  pledgeCardChecked: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.teal,
  },
  checkboxBox: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  pledgeLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  pledgeDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  masterPledgeBtn: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    flexDirection: 'row',
    gap: space.x2,
    justifyContent: 'center',
    marginTop: space.x2,
    paddingVertical: space.x3,
  },
  masterPledgeBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  celebrationHero: {
    alignItems: 'center',
    paddingVertical: space.x4,
  },
  sparkleCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    marginBottom: space.x4,
    width: 88,
  },
  celebrateTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  celebrateSub: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: space.x2,
    textAlign: 'center',
  },
  bonusBadge: {
    alignItems: 'center',
    backgroundColor: '#e6f7ef',
    borderColor: '#a3e6cd',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: space.x2,
    marginTop: space.x4,
    paddingHorizontal: space.x4,
    paddingVertical: space.x2,
  },
  bonusBadgeText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: space.x3,
    marginTop: space.x2,
    padding: space.x4,
  },
  summaryCardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: space.x1,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: space.x4,
    position: 'absolute',
    right: 0,
  },
});

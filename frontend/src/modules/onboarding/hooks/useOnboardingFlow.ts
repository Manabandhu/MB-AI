import { type Href, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { requestPermissionAndRegister, updateNotificationSettings } from '@/modules/notifications';
import {
  useCompleteOnboarding,
  useOnboardingConfig,
  useOnboardingProgress,
  useSaveOnboardingStep,
} from '@/modules/onboarding/api';
import { deleteUpload, useImageUpload } from '@/modules/shared/hooks/useImageUpload';
import { detectCurrentLocation } from '@/modules/shared/utils/location/locationService';
import {
  normalizeStepKey,
  type OnboardingStepKey,
  onboardingToSettings,
  STEP_METAS,
} from '../utils/stepMeta';

/** State, persistence, and navigation for one onboarding step. Step views only render what this returns. */
export function useOnboardingFlow(kind: OnboardingStepKey) {
  const normalizedKey = normalizeStepKey(kind);
  const meta = STEP_METAS[normalizedKey] || STEP_METAS.goals;

  const {
    data: config,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useOnboardingConfig();
  const { data: progress, isLoading: progressLoading } = useOnboardingProgress();
  const saveStepMutation = useSaveOnboardingStep();
  const completeMutation = useCompleteOnboarding();

  // Local editable state populated from persisted user progress
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [metroLocation, setMetroLocation] = useState<string>('');
  const [universityCampus, setUniversityCampus] = useState<string>('');
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('');
  const [secondaryLanguages, setSecondaryLanguages] = useState<string[]>([]);
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [bio, setBio] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const avatarUpload = useImageUpload('avatars');
  // Uploads the picked photo, then saves it on the account so every avatar in the app shows it.
  const chooseAvatar = async () => {
    const url = await avatarUpload.pickAndUpload();
    if (!url) return;
    const previous = avatarUrl;
    setAvatarUrl(url);
    try {
      await useAuthStore.getState().updateProfile({ avatar_url: url });
      if (previous) await deleteUpload('avatars', previous).catch(() => undefined);
    } catch {
      setSaveError('Your photo uploaded but could not be saved to your profile. Try again.');
    }
  };
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, boolean>>({
    emergency_sos: true,
    ride_matches: true,
    room_openings: true,
    chat_messages: true,
  });
  // Keyed by the trust step's configured option keys; nothing is hardcoded here.
  const [pledgesAccepted, setPledgesAccepted] = useState<Record<string, boolean>>({});

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
    }
  }, [progress]);

  // A saved pledge ticks every pledge the server configures for the trust step.
  useEffect(() => {
    if (!progress?.safetyPledgeAccepted) return;
    const options = config?.steps.find((s) => s.stepKey === 'trust_safety')?.options ?? [];
    setPledgesAccepted(Object.fromEntries(options.map((opt) => [opt.optionKey, true])));
  }, [progress?.safetyPledgeAccepted, config]);

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

    setSaveError(null);
    if (meta.index === 8) {
      if (pledgeMissing) {
        router.push(STEP_METAS['trust-and-safety'].route as Href);
        return;
      }
      try {
        await completeMutation.mutateAsync();
        router.replace('/home');
      } catch {
        setSaveError(
          "We couldn't finish setting up your profile. Check your connection and try again.",
        );
      }
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
      if (!allPledged) {
        setSaveError('Agree to each pledge to continue. You can also finish setup later.');
        return;
      }
      payload = { safetyPledgeAccepted: true };
    }

    try {
      await saveStepMutation.mutateAsync({
        stepKey: meta.key,
        payload,
      });
      if (meta.key === 'notifications') {
        // The choices drive real delivery: write them to the notification settings the server reads.
        await updateNotificationSettings(onboardingToSettings(notificationPreferences));
      }
    } catch {
      setSaveError("We couldn't save this step. Check your connection and try again.");
      return;
    }
    if (meta.key === 'notifications' && Object.values(notificationPreferences).some(Boolean)) {
      // Ask the OS only after the member chose alerts; a refusal is fine and can be changed in Settings later.
      await requestPermissionAndRegister().catch(() => undefined);
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

  // Leaves setup without completing it: sign-in keeps bringing the member back here until they finish.
  const finishLater = () => router.replace('/home');

  const pledgeOptions = stepConfig?.options ?? [];
  const allPledged =
    meta.key !== 'trust_safety' ||
    (pledgeOptions.length > 0 && pledgeOptions.every((opt) => pledgesAccepted[opt.optionKey]));
  // The last step only completes onboarding once the Trust Code has been agreed and saved. Unknown (progress still
  // loading or failed to load) counts as missing, so completion never skips the pledge.
  const pledgeMissing = meta.index === 8 && progress?.safetyPledgeAccepted !== true;

  // Detects the member's city from the device (or IP as a fallback) and picks the matching metro hub, if any.
  const [locating, setLocating] = useState(false);
  const detectLocation = async () => {
    setLocating(true);
    setSaveError(null);
    try {
      const city = await detectCurrentLocation();
      if (!city) {
        setSaveError("We couldn't detect your location. Search for your metro or pick one below.");
        return;
      }
      const options = stepConfig?.options ?? [];
      const needle = city.cityName.toLowerCase();
      const hub = options.find((opt) =>
        `${opt.label} ${opt.description ?? ''}`.toLowerCase().includes(needle),
      );
      setMetroLocation(hub ? hub.label : city.name);
    } finally {
      setLocating(false);
    }
  };

  return {
    meta,
    config,
    isConfigLoading,
    configError,
    refetchConfig,
    progress,
    progressLoading,
    saveStepMutation,
    completeMutation,
    saveError,
    setSaveError,
    selectedReasons,
    setSelectedReasons,
    metroLocation,
    setMetroLocation,
    universityCampus,
    setUniversityCampus,
    searchLocationQuery,
    setSearchLocationQuery,
    primaryLanguage,
    setPrimaryLanguage,
    secondaryLanguages,
    setSecondaryLanguages,
    interestTags,
    setInterestTags,
    bio,
    setBio,
    avatarUrl,
    avatarUpload,
    chooseAvatar,
    notificationPreferences,
    setNotificationPreferences,
    pledgesAccepted,
    setPledgesAccepted,
    stepConfig,
    progressPercent,
    handleNext,
    handleBack,
    handleSkip,
    finishLater,
    allPledged,
    pledgeMissing,
    locating,
    detectLocation,
  };
}

export type OnboardingFlow = ReturnType<typeof useOnboardingFlow>;

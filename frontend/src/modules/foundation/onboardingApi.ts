import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface OnboardingOption {
  id: string;
  stepKey: string;
  optionKey: string;
  label: string;
  description?: string | null;
  iconName?: string | null;
  category?: string | null;
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export interface OnboardingStep {
  stepKey: string;
  stepOrder: number;
  title: string;
  subtitle?: string | null;
  isMultiSelect: boolean;
  isRequired: boolean;
  options: OnboardingOption[];
}

export interface OnboardingConfigResponse {
  steps: OnboardingStep[];
}

export interface UserOnboardingProgress {
  userId: string;
  currentStep: string;
  isCompleted: boolean;
  selectedReasons: string[];
  metroLocation?: string | null;
  zipCode?: string | null;
  universityCampus?: string | null;
  primaryLanguage?: string | null;
  secondaryLanguages: string[];
  interestTags: string[];
  avatarUrl?: string | null;
  bio?: string | null;
  notificationPreferences?: Record<string, unknown>;
  safetyPledgeAccepted: boolean;
  completedAt?: string | null;
  updatedAt?: string | null;
}

export interface SaveStepPayload {
  stepKey: string;
  payload: Record<string, unknown>;
}

export async function getOnboardingConfig(): Promise<OnboardingConfigResponse> {
  try {
    const res = await apiFetch('/api/v1/onboarding/config');
    if (res.ok) {
      return (await res.json()) as OnboardingConfigResponse;
    }
  } catch (err) {
    // Fallback to Supabase directly if Spring Boot backend is offline
    console.warn(
      'Backend /api/v1/onboarding/config unreachable, falling back to Supabase direct query:',
      err,
    );
  }

  // Direct Supabase fallback
  const { data: stepRows, error: stepsErr } = await supabase
    .from('onboarding_steps')
    .select('step_key, step_order, title, subtitle, is_multi_select, is_required')
    .order('step_order', { ascending: true });

  if (stepsErr || !stepRows) {
    throw new Error(stepsErr?.message || 'Failed to fetch onboarding steps from database');
  }

  const { data: optionRows, error: optErr } = await supabase
    .from('onboarding_options')
    .select(
      'id, step_key, option_key, label, description, icon_name, category, sort_order, metadata',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (optErr || !optionRows) {
    throw new Error(optErr?.message || 'Failed to fetch onboarding options from database');
  }

  const optionsByStep = new Map<string, OnboardingOption[]>();
  for (const opt of optionRows) {
    const list = optionsByStep.get(opt.step_key) || [];
    list.push({
      id: opt.id,
      stepKey: opt.step_key,
      optionKey: opt.option_key,
      label: opt.label,
      description: opt.description,
      iconName: opt.icon_name,
      category: opt.category,
      sortOrder: opt.sort_order,
      metadata: opt.metadata,
    });
    optionsByStep.set(opt.step_key, list);
  }

  const steps: OnboardingStep[] = stepRows.map((s) => ({
    stepKey: s.step_key,
    stepOrder: s.step_order,
    title: s.title,
    subtitle: s.subtitle,
    isMultiSelect: s.is_multi_select ?? false,
    isRequired: s.is_required ?? true,
    options: optionsByStep.get(s.step_key) || [],
  }));

  return { steps };
}

export async function getOnboardingProgress(): Promise<UserOnboardingProgress> {
  try {
    const res = await apiFetch('/api/v1/onboarding/progress');
    if (res.ok) {
      return (await res.json()) as UserOnboardingProgress;
    }
  } catch (err) {
    console.warn('Backend /api/v1/onboarding/progress unreachable, falling back to Supabase:', err);
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id || '00000000-0000-0000-0000-000000000001';

  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching progress from Supabase:', error);
  }

  if (data) {
    return {
      userId: data.user_id,
      currentStep: data.current_step || 'goals',
      isCompleted: !!data.is_completed,
      selectedReasons: data.selected_reasons || [],
      metroLocation: data.metro_location,
      zipCode: data.zip_code,
      universityCampus: data.university_campus,
      primaryLanguage: data.primary_language,
      secondaryLanguages: data.secondary_languages || [],
      interestTags: data.interest_tags || [],
      avatarUrl: data.avatar_url,
      bio: data.bio,
      notificationPreferences: data.notification_preferences || {},
      safetyPledgeAccepted: !!data.safety_pledge_accepted,
      completedAt: data.completed_at,
      updatedAt: data.updated_at,
    };
  }

  return {
    userId,
    currentStep: 'goals',
    isCompleted: false,
    selectedReasons: [],
    secondaryLanguages: [],
    interestTags: [],
    notificationPreferences: {},
    safetyPledgeAccepted: false,
  };
}

export async function saveOnboardingStep(input: SaveStepPayload): Promise<UserOnboardingProgress> {
  try {
    const res = await apiFetch('/api/v1/onboarding/step', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (res.ok) {
      return (await res.json()) as UserOnboardingProgress;
    }
  } catch (err) {
    console.warn('Backend /api/v1/onboarding/step unreachable, saving to Supabase directly:', err);
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id || '00000000-0000-0000-0000-000000000001';

  const updateData: Record<string, unknown> = {
    user_id: userId,
    current_step: input.stepKey,
    updated_at: new Date().toISOString(),
  };

  if (input.payload.selectedReasons) updateData.selected_reasons = input.payload.selectedReasons;
  if (input.payload.metroLocation) updateData.metro_location = input.payload.metroLocation;
  if (input.payload.zipCode) updateData.zip_code = input.payload.zipCode;
  if (input.payload.universityCampus) updateData.university_campus = input.payload.universityCampus;
  if (input.payload.primaryLanguage) updateData.primary_language = input.payload.primaryLanguage;
  if (input.payload.secondaryLanguages)
    updateData.secondary_languages = input.payload.secondaryLanguages;
  if (input.payload.interestTags) updateData.interest_tags = input.payload.interestTags;
  if (input.payload.avatarUrl) updateData.avatar_url = input.payload.avatarUrl;
  if (input.payload.bio) updateData.bio = input.payload.bio;
  if (input.payload.notificationPreferences)
    updateData.notification_preferences = input.payload.notificationPreferences;
  if (input.payload.safetyPledgeAccepted !== undefined)
    updateData.safety_pledge_accepted = input.payload.safetyPledgeAccepted;

  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .upsert(updateData)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: data.user_id,
    currentStep: data.current_step,
    isCompleted: !!data.is_completed,
    selectedReasons: data.selected_reasons || [],
    metroLocation: data.metro_location,
    zipCode: data.zip_code,
    universityCampus: data.university_campus,
    primaryLanguage: data.primary_language,
    secondaryLanguages: data.secondary_languages || [],
    interestTags: data.interest_tags || [],
    avatarUrl: data.avatar_url,
    bio: data.bio,
    notificationPreferences: data.notification_preferences || {},
    safetyPledgeAccepted: !!data.safety_pledge_accepted,
    completedAt: data.completed_at,
    updatedAt: data.updated_at,
  };
}

export async function completeOnboarding(): Promise<UserOnboardingProgress> {
  try {
    const res = await apiFetch('/api/v1/onboarding/complete', { method: 'POST' });
    if (res.ok) {
      return (await res.json()) as UserOnboardingProgress;
    }
  } catch (err) {
    console.warn(
      'Backend /api/v1/onboarding/complete unreachable, saving to Supabase directly:',
      err,
    );
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id || '00000000-0000-0000-0000-000000000001';

  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .update({
      is_completed: true,
      current_step: 'complete',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: data.user_id,
    currentStep: data.current_step,
    isCompleted: true,
    selectedReasons: data.selected_reasons || [],
    metroLocation: data.metro_location,
    zipCode: data.zip_code,
    universityCampus: data.university_campus,
    primaryLanguage: data.primary_language,
    secondaryLanguages: data.secondary_languages || [],
    interestTags: data.interest_tags || [],
    avatarUrl: data.avatar_url,
    bio: data.bio,
    notificationPreferences: data.notification_preferences || {},
    safetyPledgeAccepted: !!data.safety_pledge_accepted,
    completedAt: data.completed_at,
    updatedAt: data.updated_at,
  };
}

export function useOnboardingConfig() {
  return useQuery({
    queryKey: ['onboarding-config'],
    queryFn: getOnboardingConfig,
    staleTime: 1000 * 60 * 15,
  });
}

export function useOnboardingProgress() {
  return useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: getOnboardingProgress,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveOnboardingStep,
    onSuccess: (data) => {
      queryClient.setQueryData(['onboarding-progress'], data);
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: (data) => {
      queryClient.setQueryData(['onboarding-progress'], data);
    },
  });
}

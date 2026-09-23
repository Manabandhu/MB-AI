import { zodResolver } from '@hookform/resolvers/zod';
import { color as baseColors, radius, space } from '@manabandhu/design-system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useAuthStore } from '@/lib/authStore';
import { createRoomListing, getRoomAmenities, updateRoomListing } from '@/modules/rooms/api';
import type {
  CreateRoomListingInput,
  OwnerRoomListing,
  RoomAmenityItem,
  UpdateRoomListingInput,
} from '@/modules/rooms/types';
import {
  type FreeAddressSuggestion,
  getCitiesByState,
  getUSStates,
  lookupZipCodeFree,
  searchAddressFree,
  searchAllUSCities,
} from '@/modules/rooms/utils/locationService';
import { TextArea } from '@/modules/shared/components/TextArea';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';

const colors = {
  ...baseColors,
  appPrimary: '#431ebe',
  primarySoft: '#e5deff',
  teal: '#00696b',
  tealSoft: 'rgba(0,105,107,0.08)',
  ink: '#131b2e',
  background: '#faf8ff',
  surface: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  border: '#e2e8f0',
  muted: '#625f6e',
  danger: '#ba1a1a',
  dangerSoft: '#ffdad6',
};

const roomFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(4000).optional(),
  price: z
    .string()
    .min(1, 'Rent is required')
    .refine((v) => Number(v) > 0, 'Rent must be greater than 0'),
  securityDeposit: z
    .string()
    .refine((v) => v === '' || Number(v) >= 0, 'Deposit must be 0 or positive')
    .optional(),
  utilitiesIncluded: z.boolean(),
  estUtilityMonthly: z
    .string()
    .refine((v) => v === '' || Number(v) >= 0, 'Estimated utility must be positive')
    .optional(),
  roomType: z.string().min(1, 'Room type is required').max(50),
  broadLocation: z.string().min(1, 'Location / Neighborhood is required').max(200),
  exactAddress: z.string().max(4000).optional(),
  zipCode: z.string().max(10).optional(),
  stateCode: z.string().max(50).optional(),
  county: z.string().max(100).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  dietaryPreference: z.string(),
  genderPreference: z.string(),
  bathroomType: z.string(),
  leaseTerm: z.string(),
  universityShuttleAccessible: z.boolean(),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

type RoomFormProps = {
  mode: 'create' | 'edit';
  initial?: OwnerRoomListing;
};

const ROOM_TYPES = [
  'Private Room',
  'Shared 2B2B',
  '1BHK Studio',
  'Master Bed w/ Bath',
  'Entire House / Sublease',
];

const LEASE_TERMS = [
  { id: 'FLEXIBLE', label: 'Flexible' },
  { id: 'SHORT_TERM', label: 'Short Term (1-3 mo)' },
  { id: 'LONG_TERM', label: 'Long Term (6-12 mo)' },
  { id: 'SUBLEASE', label: 'Sublease' },
  { id: 'MONTH_TO_MONTH', label: 'Month-to-Month' },
];

const DIETARY_OPTIONS = [
  { id: 'PURE_VEG', label: '🥦 Pure Veg Only' },
  { id: 'VEG_FRIENDLY', label: '🍳 Veg Friendly' },
  { id: 'NON_VEG_ALLOWED', label: '🍗 Non-Veg Allowed' },
  { id: 'ANY', label: '🌱 Any Lifestyle' },
];

const GENDER_OPTIONS = [
  { id: 'FEMALE_ONLY', label: '👩 Female Only' },
  { id: 'MALE_ONLY', label: '👨 Male Only' },
  { id: 'ANY', label: '👥 Any Gender' },
];

const BATHROOM_OPTIONS = [
  { id: 'PRIVATE_ATTACHED', label: '🚿 Private Attached' },
  { id: 'PRIVATE_DEDICATED', label: '🛁 Dedicated Bath' },
  { id: 'SHARED', label: '🚪 Shared Bath' },
];

export function RoomForm({ mode, initial }: RoomFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const isAuthenticated = status === 'authenticated' || Boolean(session?.access_token);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Address search states (Photon free OpenStreetMap API)
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<FreeAddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Selected amenities & uploaded images
  const [selectedAmenityCodes, setSelectedAmenityCodes] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  // Fetch dynamic amenities catalog from database
  const { data: amenitiesCatalog = [] } = useQuery<RoomAmenityItem[]>({
    queryKey: ['rooms', 'amenities'],
    queryFn: getRoomAmenities,
  });

  const _usStates = useMemo(() => getUSStates(), []);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      price: initial?.price != null ? String(initial.price) : '',
      securityDeposit: initial?.securityDeposit != null ? String(initial.securityDeposit) : '',
      utilitiesIncluded: initial?.utilitiesIncluded ?? false,
      estUtilityMonthly:
        initial?.estUtilityMonthly != null ? String(initial.estUtilityMonthly) : '',
      roomType: initial?.roomType ?? 'Private Room',
      broadLocation: initial?.broadLocation ?? '',
      exactAddress: initial?.exactAddress ?? '',
      zipCode: '',
      stateCode: initial?.stateCode ?? 'TX',
      county: initial?.county ?? '',
      latitude: initial?.latitude != null ? String(initial.latitude) : '',
      longitude: initial?.longitude != null ? String(initial.longitude) : '',
      dietaryPreference: initial?.dietaryPreference ?? 'VEG_FRIENDLY',
      genderPreference: initial?.genderPreference ?? 'ANY',
      bathroomType: initial?.bathroomType ?? 'SHARED',
      leaseTerm: initial?.leaseTerm ?? 'FLEXIBLE',
      universityShuttleAccessible: initial?.universityShuttleAccessible ?? false,
    },
  });

  const watchedStateCode = watch('stateCode');
  const watchedUtilitiesIncluded = watch('utilitiesIncluded');
  const watchedDietary = watch('dietaryPreference');
  const watchedGender = watch('genderPreference');
  const watchedBathroom = watch('bathroomType');
  const watchedLeaseTerm = watch('leaseTerm');
  const watchedRoomType = watch('roomType');
  const watchedShuttle = watch('universityShuttleAccessible');

  // Available cities for selected state (offline from country-state-city)
  const availableCities = useMemo(() => {
    return getCitiesByState(watchedStateCode || 'TX').slice(0, 12);
  }, [watchedStateCode]);

  // Debounced address search via OpenStreetMap Photon
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      const results = await searchAddressFree(addressQuery);
      setAddressSuggestions(results);
      setIsSearchingAddress(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [addressQuery]);

  // 1-step ZIP code quick-fill via Zippopotam
  const handleZipChange = async (zip: string) => {
    setValue('zipCode', zip);
    if (/^\d{5}$/.test(zip)) {
      const match = await lookupZipCodeFree(zip);
      if (match) {
        setValue('stateCode', match.state);
        setValue('broadLocation', `${match.city}, ${match.state}`);
        setValue('latitude', String(match.lat));
        setValue('longitude', String(match.lng));
      }
    }
  };

  const handleSelectAddressSuggestion = (item: FreeAddressSuggestion) => {
    setValue('exactAddress', item.formattedAddress);
    setValue('broadLocation', `${item.city || 'Metro'}, ${item.state}`);
    if (item.state) setValue('stateCode', item.state);
    if (item.zip) setValue('zipCode', item.zip);
    setValue('latitude', String(item.lat));
    setValue('longitude', String(item.lng));
    setAddressQuery('');
    setAddressSuggestions([]);
  };

  const toggleAmenity = (code: string) => {
    setSelectedAmenityCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  // Image Picker
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets) {
        const uris = result.assets.map((a) => a.uri);
        setPhotos((prev) => [...prev, ...uris]);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateRoomListingInput) => createRoomListing(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setSuccessNotice('Room listing posted successfully!');
      setTimeout(() => {
        router.replace('/rooms/my-listings' as Href);
      }, 500);
    },
    onError: (error: Error) => {
      setServerError(error.message || 'Failed to create room listing');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRoomListingInput) => updateRoomListing(initial?.id ?? '', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      router.replace('/rooms/my-listings' as Href);
    },
    onError: (error: Error) => setServerError(error.message),
  });

  const onSubmit = (values: RoomFormValues) => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    setServerError(null);

    let lat = values.latitude ? Number(values.latitude) : undefined;
    let lng = values.longitude ? Number(values.longitude) : undefined;
    if ((!lat || !lng) && values.broadLocation) {
      const match = searchAllUSCities(values.broadLocation, 1)[0];
      if (match?.latitude && match.longitude) {
        lat = match.latitude;
        lng = match.longitude;
      }
    }

    const payload: CreateRoomListingInput = {
      title: values.title.trim(),
      description: values.description?.trim(),
      price: Number(values.price),
      roomType: values.roomType,
      broadLocation: values.broadLocation.trim(),
      exactAddress: values.exactAddress?.trim() || undefined,
      latitude: lat,
      longitude: lng,
      dietaryPreference: values.dietaryPreference,
      genderPreference: values.genderPreference,
      bathroomType: values.bathroomType,
      utilitiesIncluded: values.utilitiesIncluded,
      estUtilityMonthly: values.estUtilityMonthly ? Number(values.estUtilityMonthly) : 0,
      securityDeposit: values.securityDeposit ? Number(values.securityDeposit) : 0,
      leaseTerm: values.leaseTerm,
      universityShuttleAccessible: values.universityShuttleAccessible,
      stateCode: values.stateCode,
      county: values.county,
    };

    if (mode === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Pressable
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AppIcon color={colors.ink} name="chevron-left" size={20} />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {mode === 'create' ? 'Post a Room Listing' : 'Edit Room Listing'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 24) + 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {serverError && (
            <View style={s.errorBanner}>
              <AppIcon color={colors.danger} name="warning" size={18} />
              <Text style={s.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {successNotice && (
            <View style={s.successBanner}>
              <AppIcon color={colors.teal} name="check" size={18} />
              <Text style={s.successBannerText}>{successNotice}</Text>
            </View>
          )}

          {/* ─── 1. Basic Information ─────────────────────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <AppIcon color={colors.appPrimary} name="home" size={20} />
              <Text style={s.cardTitle}>Basic Room Info</Text>
            </View>

            <Text style={s.inputLabel}>Listing Title *</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  testID="room-form-title"
                  placeholder="Title (e.g. Furnished Master Bedroom near Tech Corridor)"
                  placeholderTextColor={colors.muted}
                  style={[s.input, errors.title && s.inputError]}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.title && <Text style={s.fieldError}>{errors.title.message}</Text>}

            <Text style={s.inputLabel}>Room Configuration *</Text>
            <View style={s.chipsRow}>
              {ROOM_TYPES.map((type) => {
                const selected = watchedRoomType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setValue('roomType', type)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{type}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.inputLabel}>Description & House Rules</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextArea
                  testID="room-form-description"
                  placeholder="Description & House Rules: Describe the house environment, quiet hours, Indian store proximity..."
                  value={value || ''}
                  onChangeText={onChange}
                  maxLength={4000}
                />
              )}
            />
          </View>

          {/* ─── 2. Free Address & Geocoding (Photon + Zippopotam + offline) ───── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <AppIcon color={colors.teal} name="map" size={20} />
              <Text style={s.cardTitle}>Location & Address</Text>
            </View>
            <Text style={s.hintText}>
              Exact address is kept private until you approve an inquiry.
            </Text>

            <Text style={s.inputLabel}>Street Address Search (Free Photon Autocomplete)</Text>
            <View style={s.searchBox}>
              <TextInput
                testID="room-form-address"
                placeholder="Address / Street (e.g. S Denton Tap Rd)"
                placeholderTextColor={colors.muted}
                style={s.searchInput}
                value={addressQuery}
                onChangeText={(text) => {
                  setAddressQuery(text);
                  setValue('exactAddress', text);
                }}
              />
              {isSearchingAddress && <ActivityIndicator size="small" color={colors.appPrimary} />}
            </View>

            {/* Suggestions Dropdown */}
            {addressSuggestions.length > 0 && (
              <View style={s.suggestionsBox}>
                {addressSuggestions.map((item, idx) => (
                  <Pressable
                    key={idx}
                    style={s.suggestionItem}
                    onPress={() => handleSelectAddressSuggestion(item)}
                  >
                    <AppIcon color={colors.teal} name="map" size={16} />
                    <Text style={s.suggestionText} numberOfLines={2}>
                      {item.formattedAddress}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={s.rowTwoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>ZIP Code (Auto-Fill)</Text>
                <Controller
                  control={control}
                  name="zipCode"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      testID="room-form-zip"
                      placeholder="ZIP (e.g. 75019)"
                      placeholderTextColor={colors.muted}
                      style={s.input}
                      keyboardType="numeric"
                      maxLength={5}
                      value={value}
                      onChangeText={(v) => {
                        onChange(v);
                        handleZipChange(v);
                      }}
                    />
                  )}
                />
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={s.inputLabel}>State</Text>
                <Controller
                  control={control}
                  name="stateCode"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      testID="room-form-state"
                      placeholder="State (e.g. TX)"
                      placeholderTextColor={colors.muted}
                      style={s.input}
                      autoCapitalize="characters"
                      maxLength={2}
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>

            <Text style={s.inputLabel}>City & Area *</Text>
            <Controller
              control={control}
              name="broadLocation"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  testID="room-form-city"
                  placeholder="City (e.g. Coppell, TX)"
                  placeholderTextColor={colors.muted}
                  style={[s.input, errors.broadLocation && s.inputError]}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.broadLocation && (
              <Text style={s.fieldError}>{errors.broadLocation.message}</Text>
            )}

            {/* Quick city suggestions from country-state-city */}
            {availableCities.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={s.subLabel}>Quick Select City:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={s.quickChipScroll}
                >
                  {availableCities.map((city) => (
                    <Pressable
                      key={city.name}
                      onPress={() =>
                        setValue('broadLocation', `${city.name}, ${watchedStateCode || 'TX'}`)
                      }
                      style={s.quickChip}
                    >
                      <Text style={s.quickChipText}>{city.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* ─── 3. Pricing & Transparency ───────────────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <AppIcon color={colors.appPrimary} name="wallet" size={20} />
              <Text style={s.cardTitle}>Pricing & Utilities</Text>
            </View>

            <View style={s.rowTwoCol}>
              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Monthly Rent ($) *</Text>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      testID="room-form-rent"
                      placeholder="Rent ($)"
                      placeholderTextColor={colors.muted}
                      style={[s.input, errors.price && s.inputError]}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
                {errors.price && <Text style={s.fieldError}>{errors.price.message}</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.inputLabel}>Security Deposit ($)</Text>
                <Controller
                  control={control}
                  name="securityDeposit"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      testID="room-form-deposit"
                      placeholder="Deposit ($)"
                      placeholderTextColor={colors.muted}
                      style={s.input}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            </View>

            {/* Utilities toggle */}
            <Pressable
              onPress={() => setValue('utilitiesIncluded', !watchedUtilitiesIncluded)}
              style={s.toggleRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>All Utilities Included in Rent?</Text>
                <Text style={s.toggleDesc}>
                  Includes high-speed WiFi, electricity, water, gas, and trash.
                </Text>
              </View>
              <View
                style={[s.toggleIndicator, watchedUtilitiesIncluded && s.toggleIndicatorActive]}
              >
                <Text style={s.toggleIndicatorText}>{watchedUtilitiesIncluded ? 'YES' : 'NO'}</Text>
              </View>
            </Pressable>

            {!watchedUtilitiesIncluded && (
              <View style={{ marginTop: 12 }}>
                <Text style={s.inputLabel}>Estimated Monthly Utility Share ($/month)</Text>
                <Controller
                  control={control}
                  name="estUtilityMonthly"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      testID="room-form-utilities"
                      placeholder="Utilities ($)"
                      placeholderTextColor={colors.muted}
                      style={s.input}
                      keyboardType="numeric"
                      value={value}
                      onChangeText={onChange}
                    />
                  )}
                />
              </View>
            )}

            <Text style={s.inputLabel}>Lease Commitment</Text>
            <View style={s.chipsRow}>
              {LEASE_TERMS.map((term) => {
                const selected = watchedLeaseTerm === term.id;
                return (
                  <Pressable
                    key={term.id}
                    onPress={() => setValue('leaseTerm', term.id)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{term.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ─── 4. Cultural & Flatmate Preferences ──────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <AppIcon color={colors.warm} name="verified-user" size={20} />
              <Text style={s.cardTitle}>Diaspora & Flatmate Match</Text>
            </View>

            <Text style={s.inputLabel}>Dietary Kitchen Preference</Text>
            <View style={s.chipsRow}>
              {DIETARY_OPTIONS.map((opt) => {
                const selected = watchedDietary === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setValue('dietaryPreference', opt.id)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.inputLabel}>Gender Preference</Text>
            <View style={s.chipsRow}>
              {GENDER_OPTIONS.map((opt) => {
                const selected = watchedGender === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setValue('genderPreference', opt.id)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.inputLabel}>Bathroom Type</Text>
            <View style={s.chipsRow}>
              {BATHROOM_OPTIONS.map((opt) => {
                const selected = watchedBathroom === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setValue('bathroomType', opt.id)}
                    style={[s.chip, selected && s.chipSelected]}
                  >
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* University shuttle toggle */}
            <Pressable
              onPress={() => setValue('universityShuttleAccessible', !watchedShuttle)}
              style={[s.toggleRow, { marginTop: 8 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.toggleLabel}>Walkable to University / Tech Shuttle?</Text>
                <Text style={s.toggleDesc}>
                  Near UT shuttle, Apple / Amazon tech transit routes.
                </Text>
              </View>
              <View style={[s.toggleIndicator, watchedShuttle && s.toggleIndicatorActive]}>
                <Text style={s.toggleIndicatorText}>{watchedShuttle ? 'YES' : 'NO'}</Text>
              </View>
            </Pressable>
          </View>

          {/* ─── 5. Dynamic Database Amenities Catalog ──────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <AppIcon color={colors.appPrimary} name="sparks" size={20} />
              <Text style={s.cardTitle}>Amenities & Features (Dynamic)</Text>
            </View>
            <Text style={s.hintText}>Select all amenities provided in this home:</Text>

            <View style={s.amenitiesGrid}>
              {amenitiesCatalog.map((amenity) => {
                const selected = selectedAmenityCodes.includes(amenity.code);
                return (
                  <Pressable
                    key={amenity.code}
                    onPress={() => toggleAmenity(amenity.code)}
                    style={[s.amenityChip, selected && s.amenityChipSelected]}
                  >
                    <View style={[s.amenityIconCircle, selected && s.amenityIconCircleActive]}>
                      <AppIcon
                        color={selected ? '#fff' : colors.appPrimary}
                        name="check"
                        size={12}
                      />
                    </View>
                    <Text style={[s.amenityText, selected && s.amenityTextSelected]}>
                      {amenity.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ─── 6. Photos & Images ─────────────────────────────────────────── */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <AppIcon color={colors.teal} name="package" size={20} />
              <Text style={s.cardTitle}>Room Photos</Text>
            </View>

            <Pressable onPress={pickImages} style={s.photoPickerBtn}>
              <AppIcon color={colors.appPrimary} name="plus" size={24} />
              <Text style={s.photoPickerText}>Select Photos from Gallery</Text>
              <Text style={s.photoPickerSubtext}>JPG, PNG supported</Text>
            </Pressable>

            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.photoThumbRow}>
                {photos.map((uri, idx) => (
                  <View key={idx} style={s.photoThumbWrap}>
                    <Image source={{ uri }} style={s.photoThumbImg} />
                    <Pressable
                      onPress={() => removePhoto(idx)}
                      style={s.photoRemoveBtn}
                      accessibilityLabel="Remove photo"
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ─── Submit CTA ─────────────────────────────────────────────────── */}
          <View style={s.ctaWrap}>
            <AppButton
              label={
                isSubmitting || createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : mode === 'create'
                    ? 'Publish Listing'
                    : 'Save Listing Changes'
              }
              testID="publish-listing-btn"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  content: {
    padding: space.x4,
    gap: space.x4,
    paddingBottom: 100,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: space.x4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.x3,
    shadowColor: '#431ebe',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  hintText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: -4,
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  subLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '600',
    marginTop: -4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: colors.appPrimary,
    borderColor: colors.appPrimary,
  },
  chipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#fff',
  },
  rowTwoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleDesc: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  toggleIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  toggleIndicatorActive: {
    backgroundColor: colors.teal,
  },
  toggleIndicatorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.appPrimary,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 13,
  },
  suggestionsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerLow,
  },
  suggestionText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  quickChipScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  quickChip: {
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(0,105,107,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  quickChipText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: '700',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  amenityChipSelected: {
    backgroundColor: 'rgba(67,30,190,0.08)',
    borderColor: colors.appPrimary,
  },
  amenityIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityIconCircleActive: {
    backgroundColor: colors.appPrimary,
  },
  amenityText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  amenityTextSelected: {
    color: colors.appPrimary,
    fontWeight: '800',
  },
  photoPickerBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.appPrimary,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  photoPickerText: {
    color: colors.appPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  photoPickerSubtext: {
    color: colors.muted,
    fontSize: 11,
  },
  photoThumbRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  photoThumbWrap: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 12,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.tealSoft,
    borderRadius: 12,
    padding: 12,
  },
  successBannerText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  ctaWrap: {
    marginTop: 8,
  },
});

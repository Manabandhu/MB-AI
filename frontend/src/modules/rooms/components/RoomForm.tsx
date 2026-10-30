import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  addRoomImage,
  createRoomListing,
  deleteRoomImage,
  getRoomAmenities,
  listRoomImages,
  publishRoomListing,
  updateRoomListing,
} from '@/modules/rooms/api';
import {
  type CreateRoomListingInput,
  type OwnerRoomListing,
  type RoomAmenityItem,
  statusIs,
} from '@/modules/rooms/types';
import {
  BATHROOM_OPTIONS,
  DIETARY_OPTIONS,
  errorMessage,
  GENDER_OPTIONS,
  LEASE_TERMS,
  ROOM_TYPES,
} from '@/modules/rooms/utils/roomLabels';
import type { RoomSaveNotice } from '@/modules/rooms/utils/saveNotice';
import { deleteUpload, useImageUpload } from '@/modules/shared/hooks/useImageUpload';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { showError } from '@/modules/shared/ui/notify';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { TextField } from '@/modules/shared/ui/TextField';
import {
  type FreeAddressSuggestion,
  getCitiesByState,
  lookupZipCodeFree,
  searchAddressFree,
} from '@/modules/shared/utils/location/locationService';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';
import { ChipGroup, FieldPair, FormSection, ToggleRow, UploadStatus } from './room-form/FormParts';
import {
  MAX_AMENITIES,
  MAX_PHOTOS,
  optionalNumber,
  type RoomFormValues,
  roomFormSchema,
} from './room-form/schema';

type RoomFormProps = {
  mode: 'create' | 'edit';
  initial?: OwnerRoomListing;
};

/** A photo in the form: `imageId` is set once it is attached to the listing on the server. */
type FormPhoto = { url: string; imageId?: string; removing?: boolean };

/** Create/edit form for a room listing, including photos (uploaded to storage, then attached) and amenities. */
export function RoomForm({ mode, initial }: RoomFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const { palette } = useAppearance();
  const { windowClass } = useAdaptiveLayout();
  const wide = windowClass !== 'compact';
  const upload = useImageUpload('rooms');

  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  // After a create succeeded, later saves (for example a retry after a failed photo) update that listing.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const listingId = initial?.id ?? createdId;

  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<FreeAddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [photos, setPhotos] = useState<FormPhoto[]>([]);

  const amenitiesQuery = useQuery<RoomAmenityItem[]>({
    queryKey: ['rooms', 'amenities'],
    queryFn: getRoomAmenities,
    staleTime: 10 * 60_000,
  });
  const amenitiesCatalog = (amenitiesQuery.data ?? []).filter((a) => a.active !== false);

  const imagesQuery = useQuery({
    queryKey: ['rooms', 'images', initial?.id],
    queryFn: () => listRoomImages(initial?.id ?? ''),
    enabled: mode === 'edit' && Boolean(initial?.id),
  });
  const photosLoaded = useRef(false);
  useEffect(() => {
    if (photosLoaded.current || !imagesQuery.data) return;
    photosLoaded.current = true;
    setPhotos(imagesQuery.data.map((img) => ({ url: img.url, imageId: img.id })));
  }, [imagesQuery.data]);
  const photosReady = mode === 'create' || photosLoaded.current || Boolean(imagesQuery.data);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
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
      stateCode: initial?.stateCode ?? '',
      county: initial?.county ?? '',
      latitude: initial?.latitude != null ? String(initial.latitude) : '',
      longitude: initial?.longitude != null ? String(initial.longitude) : '',
      dietaryPreference: initial?.dietaryPreference?.toUpperCase() ?? 'ANY',
      genderPreference: initial?.genderPreference?.toUpperCase() ?? 'ANY',
      bathroomType: initial?.bathroomType?.toUpperCase() ?? 'SHARED',
      leaseTerm: initial?.leaseTerm?.toUpperCase() ?? 'FLEXIBLE',
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

  const availableCities = useMemo(
    () => (watchedStateCode?.length === 2 ? getCitiesByState(watchedStateCode).slice(0, 12) : []),
    [watchedStateCode],
  );

  // Debounced address search via OpenStreetMap Photon.
  useEffect(() => {
    if (!addressQuery || addressQuery.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      setAddressError(null);
      try {
        const results = await searchAddressFree(addressQuery);
        if (!cancelled) setAddressSuggestions(results);
      } catch (error) {
        if (!cancelled) setAddressError(errorMessage(error, 'Address search is unavailable.'));
      } finally {
        if (!cancelled) setIsSearchingAddress(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addressQuery]);

  const handleZipChange = async (zip: string) => {
    setValue('zipCode', zip);
    if (!/^\d{5}$/.test(zip)) return;
    try {
      const match = await lookupZipCodeFree(zip);
      if (!match) {
        setAddressError('We could not find that ZIP code. Enter the city and state by hand.');
        return;
      }
      setAddressError(null);
      setValue('stateCode', match.state);
      setValue('broadLocation', `${match.city}, ${match.state}`);
      setValue('latitude', String(match.lat));
      setValue('longitude', String(match.lng));
    } catch (error) {
      setAddressError(errorMessage(error, 'ZIP lookup is unavailable. Enter the city by hand.'));
    }
  };

  const handleSelectAddressSuggestion = (item: FreeAddressSuggestion) => {
    setValue('exactAddress', item.formattedAddress);
    setValue('broadLocation', item.city ? `${item.city}, ${item.state}` : item.state);
    if (item.state) setValue('stateCode', item.state);
    if (item.zip) setValue('zipCode', item.zip);
    setValue('latitude', String(item.lat));
    setValue('longitude', String(item.lng));
    setAddressQuery('');
    setAddressSuggestions([]);
  };

  const toggleAmenity = (code: string) => {
    setSelectedAmenities((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= MAX_AMENITIES) return prev;
      return [...prev, code];
    });
  };

  const addPhoto = async () => {
    const url = await upload.pickAndUpload();
    if (url) {
      setPhotos((prev) => [...prev, { url }]);
      upload.reset();
    }
  };

  const removePhoto = async (photo: FormPhoto) => {
    if (!photo.imageId) {
      // Uploaded but never attached: drop it and clean up storage.
      setPhotos((prev) => prev.filter((p) => p !== photo));
      try {
        await deleteUpload('rooms', photo.url);
      } catch (error) {
        showError('Photo removed, but the upload could not be cleaned up', error);
      }
      return;
    }
    setPhotos((prev) => prev.map((p) => (p === photo ? { ...p, removing: true } : p)));
    try {
      await deleteRoomImage(photo.imageId);
    } catch (error) {
      setPhotos((prev) => prev.map((p) => (p.url === photo.url ? { ...p, removing: false } : p)));
      showError('Could not remove photo', error);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.url !== photo.url));
    queryClient.invalidateQueries({ queryKey: ['rooms', 'images', listingId] });
    try {
      await deleteUpload('rooms', photo.url);
    } catch (error) {
      showError('Photo removed, but the stored file could not be deleted', error);
    }
  };

  const save = async (values: RoomFormValues, publish: boolean) => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    setServerError(null);
    setSaving(publish ? 'publish' : 'draft');

    // When editing, an emptied field must reach the server as a clear ('' / 0); undefined means "unchanged".
    const editing = Boolean(listingId);
    const text = (value: string) => value.trim() || (editing ? '' : undefined);
    const amount = (value: string) => optionalNumber(value) ?? (editing ? 0 : undefined);
    const payload: CreateRoomListingInput = {
      title: values.title.trim(),
      description: text(values.description),
      price: Number(values.price),
      roomType: values.roomType,
      broadLocation: values.broadLocation.trim(),
      exactAddress: text(values.exactAddress),
      latitude: optionalNumber(values.latitude),
      longitude: optionalNumber(values.longitude),
      dietaryPreference: values.dietaryPreference,
      genderPreference: values.genderPreference,
      bathroomType: values.bathroomType,
      utilitiesIncluded: values.utilitiesIncluded,
      estUtilityMonthly: values.utilitiesIncluded ? undefined : amount(values.estUtilityMonthly),
      securityDeposit: amount(values.securityDeposit),
      leaseTerm: values.leaseTerm,
      universityShuttleAccessible: values.universityShuttleAccessible,
      stateCode: text(values.stateCode),
      county: text(values.county),
      amenities: selectedAmenities,
    };

    let id = listingId;
    let status = initial?.status;
    try {
      if (id) {
        status = (await updateRoomListing(id, payload)).status;
      } else {
        const created = await createRoomListing(payload);
        id = created.id;
        status = created.status;
        setCreatedId(created.id);
      }
    } catch (error) {
      setSaving(null);
      setServerError(errorMessage(error, 'Could not save the listing.'));
      return;
    }

    // Attach photos that are uploaded but not yet on the listing, in order.
    for (const [index, photo] of photos.entries()) {
      if (photo.imageId) continue;
      try {
        const image = await addRoomImage(id, { url: photo.url, sortOrder: index });
        setPhotos((prev) =>
          prev.map((p) => (p.url === photo.url ? { ...p, imageId: image.id } : p)),
        );
      } catch (error) {
        setSaving(null);
        await queryClient.invalidateQueries({ queryKey: ['rooms'] });
        setServerError(
          `The listing was saved, but photo ${index + 1} could not be attached: ${errorMessage(error)} ` +
            'Fix the problem and save again; photos already attached are kept.',
        );
        return;
      }
    }

    const wasActive = statusIs(status, 'active');
    let published = wasActive;
    if (publish && !published) {
      try {
        await publishRoomListing(id);
        published = true;
      } catch (error) {
        setSaving(null);
        await queryClient.invalidateQueries({ queryKey: ['rooms'] });
        setServerError(
          `Your changes were saved, but the listing could not be published: ${errorMessage(error)}`,
        );
        return;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['rooms'] });
    setSaving(null);
    const notice: RoomSaveNotice = wasActive
      ? 'saved-visible'
      : published
        ? 'published'
        : mode === 'create'
          ? 'draft'
          : 'saved';
    router.replace({ pathname: '/rooms/my-listings', params: { notice } } as Href);
  };

  const initialStatus = initial?.status;
  const canPublish =
    mode === 'create' || statusIs(initialStatus, 'draft', 'paused') || Boolean(createdId);
  const busy = saving !== null || upload.state.status === 'uploading';

  return (
    <YStack backgroundColor="$background" flex={1}>
      <Screen bottomInset={ACTION_BAR_SPACE} keyboardAvoiding maxWidth="form">
        <YStack gap="$x4">
          <ScreenHeader
            back={{ fallback: (mode === 'edit' ? '/rooms/my-listings' : '/rooms') as Href }}
            subtitle={
              mode === 'create'
                ? 'Fields marked * are required. You can save a draft and finish later.'
                : null
            }
            title={mode === 'create' ? 'Post a room' : 'Edit listing'}
          />

          {/* 1. Basics */}
          <FormSection icon="home" title="Basics">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  error={errors.title?.message}
                  label="Listing title *"
                  maxLength={200}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="e.g. Furnished room near the tech corridor"
                  value={value}
                />
              )}
            />
            <ChipGroup label="Room type *" radio>
              {ROOM_TYPES.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onPress={() => setValue('roomType', type)}
                  radio
                  selected={watchedRoomType === type}
                />
              ))}
            </ChipGroup>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  error={errors.description?.message}
                  label="Description and house rules"
                  maxLength={4000}
                  multiline
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="The home, quiet hours, roommates, nearby transit…"
                  value={value}
                />
              )}
            />
          </FormSection>

          {/* 2. Location */}
          <FormSection icon="map-pin" title="Location">
            <AppText tone="muted" variant="caption">
              The exact address is visible only to you. Renters see the approximate area; share the
              address in chat when you are ready.
            </AppText>
            <XStack alignItems="flex-end" gap="$x2">
              <YStack flex={1}>
                <TextField
                  autoCorrect={false}
                  error={addressError}
                  label="Search street address"
                  onChangeText={setAddressQuery}
                  placeholder="Street or neighborhood"
                  value={addressQuery}
                />
              </YStack>
              {isSearchingAddress ? (
                <YStack height="$control" justifyContent="center">
                  <ActivityIndicator color={palette.primary} />
                </YStack>
              ) : null}
            </XStack>
            {addressSuggestions.length > 0 ? (
              <Card gap={0} padding={0} variant="outlined">
                {addressSuggestions.map((item) => (
                  <XStack
                    alignItems="center"
                    aria-label={`Use address ${item.formattedAddress}`}
                    cursor="pointer"
                    focusable
                    focusVisibleStyle={{
                      outlineWidth: 3,
                      outlineStyle: 'solid',
                      outlineColor: '$outlineColor',
                    }}
                    gap="$x2"
                    key={`${item.formattedAddress}-${item.lat}-${item.lng}`}
                    minHeight={44}
                    onPress={() => handleSelectAddressSuggestion(item)}
                    paddingHorizontal="$x3"
                    paddingVertical="$x2"
                    pressStyle={{ backgroundColor: '$surfaceContainerLow' }}
                    role="button"
                    {...keyboardPress(() => handleSelectAddressSuggestion(item))}
                  >
                    <AppIcon color={palette.teal} name="map-pin" size={16} />
                    <AppText flex={1} numberOfLines={2} variant="caption">
                      {item.formattedAddress}
                    </AppText>
                  </XStack>
                ))}
              </Card>
            ) : null}
            <Controller
              control={control}
              name="exactAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Exact address (private)"
                  maxLength={4000}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Street, unit"
                  value={value}
                />
              )}
            />
            <FieldPair wide={wide}>
              <YStack flex={wide ? 1 : undefined}>
                <Controller
                  control={control}
                  name="zipCode"
                  render={({ field: { onBlur, value } }) => (
                    <TextField
                      keyboardType="number-pad"
                      label="ZIP code"
                      maxLength={5}
                      onBlur={onBlur}
                      onChangeText={handleZipChange}
                      placeholder="78758"
                      value={value}
                    />
                  )}
                />
              </YStack>
              <YStack flex={wide ? 1.5 : undefined}>
                <Controller
                  control={control}
                  name="stateCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      autoCapitalize="characters"
                      error={errors.stateCode?.message}
                      label="State"
                      maxLength={50}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="TX"
                      value={value}
                    />
                  )}
                />
              </YStack>
            </FieldPair>
            <Controller
              control={control}
              name="broadLocation"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  error={errors.broadLocation?.message}
                  label="City and area *"
                  maxLength={200}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="e.g. North Austin, TX"
                  value={value}
                />
              )}
            />
            {availableCities.length > 0 ? (
              <ChipGroup label="Quick pick a city">
                {availableCities.map((city) => (
                  <Chip
                    key={city.name}
                    label={city.name}
                    onPress={() => setValue('broadLocation', `${city.name}, ${watchedStateCode}`)}
                  />
                ))}
              </ChipGroup>
            ) : null}
          </FormSection>

          {/* 3. Pricing */}
          <FormSection icon="wallet" title="Rent and utilities">
            <FieldPair wide={wide}>
              <YStack flex={wide ? 1 : undefined}>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      error={errors.price?.message}
                      keyboardType="decimal-pad"
                      label="Monthly rent ($) *"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="850"
                      value={value}
                    />
                  )}
                />
              </YStack>
              <YStack flex={wide ? 1 : undefined}>
                <Controller
                  control={control}
                  name="securityDeposit"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      error={errors.securityDeposit?.message}
                      helper="Leave empty if not decided"
                      keyboardType="decimal-pad"
                      label="Security deposit ($)"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="500"
                      value={value}
                    />
                  )}
                />
              </YStack>
            </FieldPair>
            <ToggleRow
              description="Wi-Fi, electricity, water, gas, and trash are part of the rent."
              label="Utilities included in rent"
              onToggle={() => setValue('utilitiesIncluded', !watchedUtilitiesIncluded)}
              value={watchedUtilitiesIncluded}
            />
            {!watchedUtilitiesIncluded ? (
              <Controller
                control={control}
                name="estUtilityMonthly"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    error={errors.estUtilityMonthly?.message}
                    keyboardType="decimal-pad"
                    label="Estimated utilities ($/month)"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="70"
                    value={value}
                  />
                )}
              />
            ) : null}
            <ChipGroup label="Lease" radio>
              {LEASE_TERMS.map((term) => (
                <Chip
                  key={term.id}
                  label={term.label}
                  onPress={() => setValue('leaseTerm', term.id)}
                  radio
                  selected={watchedLeaseTerm === term.id}
                />
              ))}
            </ChipGroup>
          </FormSection>

          {/* 4. Household */}
          <FormSection icon="community" title="Household">
            <ChipGroup label="Kitchen / diet" radio>
              {DIETARY_OPTIONS.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  onPress={() => setValue('dietaryPreference', opt.id)}
                  radio
                  selected={watchedDietary === opt.id}
                />
              ))}
            </ChipGroup>
            <ChipGroup label="Roommate gender" radio>
              {GENDER_OPTIONS.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  onPress={() => setValue('genderPreference', opt.id)}
                  radio
                  selected={watchedGender === opt.id}
                />
              ))}
            </ChipGroup>
            <ChipGroup label="Bathroom" radio>
              {BATHROOM_OPTIONS.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  onPress={() => setValue('bathroomType', opt.id)}
                  radio
                  selected={watchedBathroom === opt.id}
                />
              ))}
            </ChipGroup>
            <ToggleRow
              description="Within walking distance of a university or employer shuttle stop."
              label="Near a university or shuttle"
              onToggle={() => setValue('universityShuttleAccessible', !watchedShuttle)}
              value={watchedShuttle}
            />
          </FormSection>

          {/* 5. Amenities */}
          <FormSection icon="check" title="Amenities">
            {amenitiesQuery.isLoading ? (
              <ActivityIndicator color={palette.primary} />
            ) : amenitiesQuery.isError ? (
              <ErrorState
                body={errorMessage(amenitiesQuery.error)}
                compact
                onRetry={() => amenitiesQuery.refetch()}
                retryLabel="Retry"
                title="Could not load amenities"
              />
            ) : (
              <ChipGroup label={`Selected ${selectedAmenities.length} of up to ${MAX_AMENITIES}`}>
                {amenitiesCatalog.map((amenity) => (
                  <Chip
                    key={amenity.code}
                    label={amenity.label}
                    onPress={() => toggleAmenity(amenity.code)}
                    selected={selectedAmenities.includes(amenity.code)}
                  />
                ))}
                {/* Values saved earlier that are not in the catalog stay visible so they can be removed. */}
                {selectedAmenities
                  .filter((value) => !amenitiesCatalog.some((a) => a.code === value))
                  .map((value) => (
                    <Chip key={value} label={value} onPress={() => toggleAmenity(value)} selected />
                  ))}
              </ChipGroup>
            )}
          </FormSection>

          {/* 6. Photos */}
          <FormSection icon="eye" title={`Photos (${photos.length}/${MAX_PHOTOS})`}>
            {mode === 'edit' && imagesQuery.isError ? (
              <ErrorState
                body={errorMessage(imagesQuery.error)}
                compact
                onRetry={() => imagesQuery.refetch()}
                retryLabel="Retry"
                title="Could not load photos"
              />
            ) : !photosReady ? (
              <ActivityIndicator color={palette.primary} />
            ) : (
              <>
                {photos.length > 0 ? (
                  <XStack flexWrap="wrap" gap="$x3">
                    {photos.map((photo, index) => (
                      <YStack
                        borderRadius="$control"
                        height={96}
                        key={photo.url}
                        overflow="hidden"
                        position="relative"
                        width={96}
                      >
                        <Image
                          accessibilityLabel={`Photo ${index + 1}`}
                          contentFit="cover"
                          source={{ uri: photo.url }}
                          style={{ width: 96, height: 96, opacity: photo.removing ? 0.4 : 1 }}
                        />
                        <YStack position="absolute" right={0} top={0}>
                          {photo.removing ? (
                            <YStack
                              alignItems="center"
                              height="$touch"
                              justifyContent="center"
                              width="$touch"
                            >
                              <ActivityIndicator color={palette.primary} />
                            </YStack>
                          ) : (
                            <IconButton
                              icon="close"
                              label={`Remove photo ${index + 1}`}
                              onPress={() => removePhoto(photo)}
                              size={16}
                              variant="solid"
                            />
                          )}
                        </YStack>
                        {!photo.imageId ? (
                          <YStack
                            backgroundColor="$primary"
                            bottom={0}
                            left={0}
                            paddingVertical={2}
                            position="absolute"
                            right={0}
                          >
                            <AppText center tone="onPrimary" variant="caption">
                              Not saved yet
                            </AppText>
                          </YStack>
                        ) : null}
                      </YStack>
                    ))}
                  </XStack>
                ) : (
                  <AppText tone="muted" variant="caption">
                    Listings with photos get more inquiries. Add up to {MAX_PHOTOS} (JPEG, PNG,
                    WebP, HEIC; 5 MB each).
                  </AppText>
                )}
                <UploadStatus
                  state={upload.state}
                  onCancel={upload.cancel}
                  onDismiss={upload.reset}
                />
                {photos.length < MAX_PHOTOS ? (
                  <AppButton
                    disabled={
                      upload.state.status === 'uploading' || upload.state.status === 'picking'
                    }
                    icon="plus"
                    label="Add photo"
                    onPress={addPhoto}
                    variant="secondary"
                  />
                ) : (
                  <AppText tone="muted" variant="caption">
                    You reached the {MAX_PHOTOS}-photo limit. Remove one to add another.
                  </AppText>
                )}
              </>
            )}
          </FormSection>

          {serverError ? (
            <Card aria-live="polite" borderColor="$error" variant="outlined">
              <XStack alignItems="flex-start" gap="$x2">
                <AppIcon color={palette.error} name="warning" size={18} />
                <AppText flex={1} tone="danger" variant="label">
                  {serverError}
                </AppText>
              </XStack>
            </Card>
          ) : null}
        </YStack>
      </Screen>

      <ActionBar
        label="Save listing"
        leading={
          upload.state.status === 'uploading' ? (
            <AppText tone="muted" variant="caption">
              Wait for the photo upload to finish.
            </AppText>
          ) : serverError ? (
            <AppText tone="danger" variant="caption">
              Not saved yet. See the message above.
            </AppText>
          ) : null
        }
      >
        {canPublish ? (
          <>
            <AppButton
              disabled={busy && saving !== 'draft'}
              label={statusIs(initialStatus, 'paused') ? 'Save, keep paused' : 'Save draft'}
              loading={saving === 'draft'}
              onPress={handleSubmit((values) => save(values, false))}
              variant="secondary"
            />
            <AppButton
              disabled={busy && saving !== 'publish'}
              label={mode === 'create' && !createdId ? 'Publish now' : 'Save and publish'}
              loading={saving === 'publish'}
              onPress={handleSubmit((values) => save(values, true))}
            />
          </>
        ) : (
          <AppButton
            disabled={busy && saving !== 'draft'}
            label="Save changes"
            loading={saving === 'draft'}
            onPress={handleSubmit((values) => save(values, false))}
          />
        )}
      </ActionBar>
    </YStack>
  );
}

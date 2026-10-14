import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme, XStack, YStack } from 'tamagui';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { deleteUpload, useImageUpload } from '@/modules/shared/hooks/useImageUpload';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon, type AppIconName } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { keyboardPress } from '@/modules/shared/ui/keyboardPress';
import { Screen } from '@/modules/shared/ui/Screen';
import { SegmentedControl } from '@/modules/shared/ui/SegmentedControl';
import { TextField } from '@/modules/shared/ui/TextField';
import {
  addListingImage,
  createMarketplaceListing,
  deleteListingImage,
  getMarketplaceListingImages,
  listMarketplaceCategories,
  updateListing,
} from '../api';
import type { MarketplaceListing } from '../types';
import { formatListingPrice } from '../utils/format';
import {
  CONDITIONS,
  DESCRIPTION_MAX,
  errorMessage,
  LOCATION_MAX,
  MAX_PHOTOS,
  parsePrice,
  TITLE_MAX,
} from '../utils/listingRules';
import { showError } from '../utils/notify';

/** A photo in the form: `imageId` is set once it is attached to the listing on the server. */
type FormPhoto = { url: string; imageId?: string; removing?: boolean };

type FieldErrors = Partial<Record<'title' | 'category' | 'price', string>>;

type ListingFormProps = { mode: 'create' } | { mode: 'edit'; initial: MarketplaceListing };

/**
 * Create/edit form for a marketplace listing. Photos are uploaded to storage when picked and attached to the
 * listing after it is saved, in order. If attaching fails, the created listing id is kept so a retry updates it
 * instead of creating a duplicate, and the success screen is never shown.
 */
export function ListingForm(props: ListingFormProps) {
  const initial = props.mode === 'edit' ? props.initial : undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const upload = useImageUpload('marketplace');

  const [title, setTitle] = useState(initial?.title ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(initial?.category?.id ?? null);
  const [condition, setCondition] = useState<string | null>(initial?.condition ?? null);
  const [isFree, setIsFree] = useState(initial ? Number(initial.price) === 0 : false);
  const [priceText, setPriceText] = useState(
    initial && Number(initial.price) > 0 ? String(initial.price) : '',
  );
  const [negotiable, setNegotiable] = useState(initial?.negotiable ?? true);
  const [location, setLocation] = useState(initial?.location ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [photos, setPhotos] = useState<FormPhoto[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // After a create succeeded, later saves (a retry after a failed photo) update that listing.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [published, setPublished] = useState<MarketplaceListing | null>(null);
  const listingId = initial?.id ?? createdId;

  const categoriesQuery = useQuery({
    queryKey: ['marketplace', 'categories'],
    queryFn: listMarketplaceCategories,
    staleTime: 10 * 60_000,
  });

  const imagesQuery = useQuery({
    queryKey: ['marketplace', 'images', initial?.id],
    queryFn: () => getMarketplaceListingImages(initial?.id ?? ''),
    enabled: Boolean(initial?.id),
  });
  const photosLoaded = useRef(false);
  useEffect(() => {
    if (photosLoaded.current || !imagesQuery.data) return;
    photosLoaded.current = true;
    setPhotos(imagesQuery.data.map((img) => ({ url: img.url, imageId: img.id })));
  }, [imagesQuery.data]);
  const photosReady = !initial || photosLoaded.current || Boolean(imagesQuery.data);

  const resetForm = () => {
    setTitle('');
    setCategoryId(null);
    setCondition(null);
    setIsFree(false);
    setPriceText('');
    setNegotiable(true);
    setLocation('');
    setDescription('');
    setPhotos([]);
    setFieldErrors({});
    setServerError(null);
    setCreatedId(null);
    setPublished(null);
    upload.reset();
  };

  const addPhoto = async () => {
    const url = await upload.pickAndUpload();
    if (url) {
      setPhotos((prev) => [...prev, { url }]);
      upload.reset();
    }
  };

  const removePhoto = async (photo: FormPhoto, index: number) => {
    if (!photo.imageId) {
      // Uploaded but never attached: drop it and clean up storage.
      setPhotos((prev) => prev.filter((p) => p.url !== photo.url));
      try {
        await deleteUpload('marketplace', photo.url);
      } catch (error) {
        showError('Photo removed, but the upload could not be cleaned up', error);
      }
      return;
    }
    setPhotos((prev) => prev.map((p) => (p.url === photo.url ? { ...p, removing: true } : p)));
    try {
      // The backend deletes the stored file together with the image row.
      await deleteListingImage(photo.imageId);
    } catch (error) {
      setPhotos((prev) => prev.map((p) => (p.url === photo.url ? { ...p, removing: false } : p)));
      showError(`Could not remove photo ${index + 1}`, error);
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.url !== photo.url));
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'images', listingId] });
  };

  const validate = (): { price: number } | null => {
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = 'Give your item a title.';
    if (!categoryId) errors.category = 'Choose a category.';
    let price = 0;
    if (!isFree) {
      const parsed = parsePrice(priceText);
      if ('error' in parsed) errors.price = parsed.error;
      else price = parsed.value;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setServerError('Fix the highlighted fields and try again.');
      return null;
    }
    return { price };
  };

  const save = async () => {
    setServerError(null);
    const valid = validate();
    if (!valid || !categoryId) return;
    setSaving(true);

    let saved: MarketplaceListing;
    try {
      if (listingId) {
        // '' clears optional text fields on the server; undefined would mean "unchanged".
        saved = await updateListing(listingId, {
          categoryId,
          title: title.trim(),
          description: description.trim(),
          price: valid.price,
          condition: condition ?? '',
          location: location.trim(),
          negotiable: valid.price > 0 && negotiable,
        });
      } else {
        saved = await createMarketplaceListing({
          categoryId,
          title: title.trim(),
          description: description.trim() || undefined,
          price: valid.price,
          currency: 'USD',
          condition: condition ?? undefined,
          location: location.trim() || undefined,
          negotiable: valid.price > 0 && negotiable,
        });
        setCreatedId(saved.id);
      }
    } catch (error) {
      setSaving(false);
      const status = (error as { status?: number } | null)?.status;
      setServerError(
        status === 400 && !categoriesQuery.data?.some((c) => c.id === categoryId)
          ? 'That category no longer exists. Choose another one.'
          : errorMessage(error, 'Could not save the listing.'),
      );
      return;
    }

    // Attach photos that are uploaded but not yet on the listing, in order.
    for (const [index, photo] of photos.entries()) {
      if (photo.imageId) continue;
      try {
        const image = await addListingImage(saved.id, { url: photo.url, sortOrder: index });
        setPhotos((prev) =>
          prev.map((p) => (p.url === photo.url ? { ...p, imageId: image.id } : p)),
        );
      } catch (error) {
        setSaving(false);
        await invalidate(queryClient, saved.id);
        setServerError(
          `The listing was saved, but photo ${index + 1} could not be attached: ${errorMessage(error)} ` +
            'Remove that photo or try again; photos already attached are kept and the listing is not duplicated.',
        );
        return;
      }
    }

    await invalidate(queryClient, saved.id);
    setSaving(false);
    if (props.mode === 'edit') {
      router.replace(`/marketplace/${saved.id}` as Href);
    } else {
      setPublished(saved);
    }
  };

  if (published) {
    return (
      <Screen>
        <YStack alignItems="center" gap="$x4" paddingVertical="$x8">
          <YStack
            alignItems="center"
            backgroundColor="$successBg"
            borderRadius="$pill"
            height={72}
            justifyContent="center"
            width={72}
          >
            <AppIcon color={theme.success?.val} name="check" size={36} />
          </YStack>
          <AppText center role="heading" variant="h2">
            Your item is listed
          </AppText>
          <AppText center tone="muted">
            It is live in the marketplace. Buyers can message you in ManaBandhu chat, and you can
            mark it reserved or sold from My listings.
          </AppText>
          <Card alignSelf="stretch" gap="$x1" variant="outlined">
            <AppText variant="bodyStrong">{published.title}</AppText>
            <AppText tone="primary" variant="label">
              {formatListingPrice(published.price, published.currency)}
            </AppText>
            <AppText tone="muted" variant="caption">
              {photos.length === 0
                ? 'No photos'
                : `${photos.length} photo${photos.length === 1 ? '' : 's'}`}
            </AppText>
          </Card>
          <YStack alignSelf="stretch" gap="$x2">
            <AppButton
              fullWidth
              label="View listing"
              onPress={() => router.replace(`/marketplace/${published.id}` as Href)}
            />
            <AppButton
              fullWidth
              label="List another item"
              onPress={resetForm}
              variant="secondary"
            />
            <AppButton
              fullWidth
              label="My listings"
              onPress={() => router.replace('/marketplace/mine' as Href)}
              variant="ghost"
            />
          </YStack>
        </YStack>
      </Screen>
    );
  }

  const busy = saving || upload.state.status === 'uploading';
  const categories = categoriesQuery.data ?? [];
  const selectedCondition = CONDITIONS.find((c) => c.id === condition);
  const descriptionLeft = DESCRIPTION_MAX - description.length;

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
      }
      style={{ flex: 1 }}
    >
      <Screen>
        <YStack gap="$x4">
          <XStack alignItems="center" gap="$x2">
            <BackButton fallback={initial ? `/marketplace/${initial.id}` : '/marketplace'} />
            <YStack flex={1}>
              <AppText role="heading" variant="h2">
                {initial ? 'Edit listing' : 'Sell an item'}
              </AppText>
              <AppText tone="muted" variant="caption">
                Buyers contact you through ManaBandhu chat. Agree on price and pickup there.
              </AppText>
            </YStack>
          </XStack>

          <FormSection icon="package" title={`Photos (${photos.length}/${MAX_PHOTOS})`}>
            {initial && imagesQuery.isError ? (
              <ErrorState
                body={errorMessage(imagesQuery.error)}
                compact
                onRetry={() => imagesQuery.refetch()}
                retryLabel="Retry"
                title="Could not load photos"
              />
            ) : !photosReady ? (
              <ActivityIndicator color={theme.primary?.val} />
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
                          accessibilityLabel={`Photo ${index + 1}${index === 0 ? ' (cover)' : ''}`}
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
                              <ActivityIndicator color={theme.primary?.val} />
                            </YStack>
                          ) : (
                            <IconButton
                              icon="close"
                              label={`Remove photo ${index + 1}`}
                              onPress={() => removePhoto(photo, index)}
                              size={16}
                              variant="solid"
                            />
                          )}
                        </YStack>
                        {!photo.imageId || index === 0 ? (
                          <YStack
                            backgroundColor="$primary"
                            bottom={0}
                            left={0}
                            paddingVertical={2}
                            position="absolute"
                            right={0}
                          >
                            <AppText center tone="onPrimary" variant="caption">
                              {!photo.imageId ? 'Not saved yet' : 'Cover'}
                            </AppText>
                          </YStack>
                        ) : null}
                      </YStack>
                    ))}
                  </XStack>
                ) : (
                  <AppText tone="muted" variant="caption">
                    Items with photos sell faster. Add up to {MAX_PHOTOS} (JPEG, PNG, WebP, HEIC; 5
                    MB each). The first photo is the cover.
                  </AppText>
                )}
                <UploadStatus
                  onCancel={upload.cancel}
                  onDismiss={upload.reset}
                  state={upload.state}
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

          <FormSection icon="marketplace" title="Item details">
            <TextField
              error={fieldErrors.title}
              helper={`${title.length}/${TITLE_MAX}`}
              label="Title *"
              maxLength={TITLE_MAX}
              onChangeText={setTitle}
              placeholder="e.g. Mixer grinder, 110V US model"
              value={title}
            />

            <YStack gap="$x2">
              <AppText variant="label">Category *</AppText>
              {categoriesQuery.isError ? (
                <ErrorState
                  body={errorMessage(categoriesQuery.error)}
                  compact
                  onRetry={() => categoriesQuery.refetch()}
                  retryLabel="Retry"
                  title="Could not load categories"
                />
              ) : categoriesQuery.isLoading ? (
                <XStack alignItems="center" gap="$x2">
                  <ActivityIndicator color={theme.primary?.val} />
                  <AppText tone="muted" variant="caption">
                    Loading categories…
                  </AppText>
                </XStack>
              ) : categories.length === 0 ? (
                <AppText tone="danger" variant="caption">
                  No categories are set up yet, so listings cannot be created. Please try later.
                </AppText>
              ) : (
                <XStack aria-label="Category" flexWrap="wrap" gap="$x2" role="radiogroup">
                  {categories.map((c) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      onPress={() => setCategoryId(c.id)}
                      selected={categoryId === c.id}
                    />
                  ))}
                </XStack>
              )}
              {fieldErrors.category ? (
                <AppText aria-live="polite" tone="danger" variant="caption">
                  {fieldErrors.category}
                </AppText>
              ) : null}
            </YStack>

            <YStack gap="$x2">
              <AppText variant="label">Condition</AppText>
              <XStack aria-label="Condition" flexWrap="wrap" gap="$x2" role="radiogroup">
                {CONDITIONS.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.id}
                    onPress={() => setCondition(condition === c.id ? null : c.id)}
                    selected={condition === c.id}
                  />
                ))}
              </XStack>
              <AppText tone="muted" variant="caption">
                {selectedCondition ? selectedCondition.hint : 'Optional. Tap again to clear.'}
              </AppText>
            </YStack>
          </FormSection>

          <FormSection icon="wallet" title="Price">
            <SegmentedControl
              label="Price type"
              onChange={(v) => {
                setIsFree(v === 'free');
                setFieldErrors((e) => ({ ...e, price: undefined }));
              }}
              options={[
                { value: 'price', label: 'Set a price' },
                { value: 'free', label: 'Give for free' },
              ]}
              value={isFree ? 'free' : 'price'}
            />
            {isFree ? (
              <AppText tone="muted" variant="caption">
                Listed as Free. Thank you for giving back to the community.
              </AppText>
            ) : (
              <>
                <TextField
                  error={fieldErrors.price}
                  helper="US dollars, up to two decimals (for example 24.99)."
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  label="Price (USD) *"
                  maxLength={11}
                  onChangeText={setPriceText}
                  placeholder="0.00"
                  value={priceText}
                />
                <ToggleRow
                  description="Buyers can offer a lower price in chat."
                  label="Price is negotiable"
                  onToggle={() => setNegotiable((v) => !v)}
                  value={negotiable}
                />
              </>
            )}
          </FormSection>

          <FormSection icon="map-pin" title="Area">
            <TextField
              helper="Neighborhood or city only. Don't enter your street address; share pickup details in chat."
              label="Area"
              maxLength={LOCATION_MAX}
              onChangeText={setLocation}
              placeholder="e.g. Irving, TX"
              value={location}
            />
          </FormSection>

          <FormSection icon="book" title="Description">
            <TextField
              helper={`${descriptionLeft} characters left`}
              label="Description"
              maxLength={DESCRIPTION_MAX}
              multiline
              onChangeText={setDescription}
              placeholder="Condition details, what is included, reason for selling, pickup times…"
              value={description}
            />
          </FormSection>

          <YStack gap="$x2">
            {serverError ? (
              <Card aria-live="polite" borderColor="$error" variant="outlined">
                <XStack alignItems="flex-start" gap="$x2">
                  <AppIcon color={theme.error?.val} name="warning" size={18} />
                  <AppText flex={1} tone="danger" variant="label">
                    {serverError}
                  </AppText>
                </XStack>
              </Card>
            ) : null}
            <AppButton
              disabled={busy && !saving}
              fullWidth
              label={
                initial ? 'Save changes' : createdId ? 'Retry attaching photos' : 'Publish listing'
              }
              loading={saving}
              onPress={save}
              size="lg"
            />
            {createdId && !initial ? (
              <AppButton
                disabled={busy}
                fullWidth
                label="Open listing without the remaining photos"
                onPress={() => router.replace(`/marketplace/${createdId}` as Href)}
                variant="ghost"
              />
            ) : null}
            {upload.state.status === 'uploading' ? (
              <AppText center tone="muted" variant="caption">
                Wait for the photo upload to finish before saving.
              </AppText>
            ) : null}
          </YStack>
        </YStack>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] }),
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'mine'] }),
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', id] }),
    queryClient.invalidateQueries({ queryKey: ['marketplace', 'images', id] }),
  ]);
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: AppIconName;
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card gap="$x3" variant="outlined">
      <XStack alignItems="center" gap="$x2">
        <AppIcon color={theme.primary?.val} name={icon} size={20} />
        <AppText role="heading" variant="h4">
          {title}
        </AppText>
      </XStack>
      {children}
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <XStack
      alignItems="center"
      aria-checked={value}
      aria-label={label}
      backgroundColor="$surfaceContainerLow"
      borderRadius="$control"
      cursor="pointer"
      focusVisibleStyle={{ outlineWidth: 3, outlineStyle: 'solid', outlineColor: '$outlineColor' }}
      focusable
      gap="$x3"
      minHeight={52}
      onPress={onToggle}
      {...keyboardPress(onToggle)}
      padding="$x3"
      role="switch"
    >
      <YStack flex={1} gap={2}>
        <AppText variant="label">{label}</AppText>
        <AppText tone="muted" variant="caption">
          {description}
        </AppText>
      </YStack>
      <Chip label={value ? 'Yes' : 'No'} selected={value} />
    </XStack>
  );
}

function UploadStatus({
  state,
  onCancel,
  onDismiss,
}: {
  state: ReturnType<typeof useImageUpload>['state'];
  onCancel: () => void;
  onDismiss: () => void;
}) {
  if (state.status === 'picking') {
    return (
      <AppText aria-live="polite" tone="muted" variant="caption">
        Choose a photo…
      </AppText>
    );
  }
  if (state.status === 'uploading') {
    return (
      <XStack alignItems="center" aria-live="polite" gap="$x3">
        <YStack backgroundColor="$surfaceContainerLow" borderRadius="$pill" flex={1} height={8}>
          <YStack
            backgroundColor="$primary"
            borderRadius="$pill"
            height={8}
            width={`${Math.max(4, state.progress)}%`}
          />
        </YStack>
        <AppText variant="caption">Uploading {state.progress}%</AppText>
        <AppButton label="Cancel" onPress={onCancel} variant="ghost" />
      </XStack>
    );
  }
  if (state.status === 'error') {
    return (
      <XStack alignItems="center" aria-live="polite" gap="$x2">
        <AppText flex={1} tone="danger" variant="caption">
          {state.message}
        </AppText>
        <AppButton label="Dismiss" onPress={onDismiss} variant="ghost" />
      </XStack>
    );
  }
  return null;
}

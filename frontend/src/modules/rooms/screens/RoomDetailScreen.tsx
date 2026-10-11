import { formatMoney } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  getRoomAmenities,
  getRoomDetail,
  inquireRoom,
  listRoomImages,
  markRoomRented,
  pauseRoomListing,
  publishRoomListing,
  reportRoom,
} from '@/modules/rooms/api';
import { useRoomSave } from '@/modules/rooms/hooks/useRoomSave';
import { type RoomListing, statusIs } from '@/modules/rooms/types';
import { showError } from '@/modules/rooms/utils/notify';
import {
  amenityLabel,
  bathroomLabel,
  dietaryLabel,
  errorMessage,
  genderLabel,
  isNotFound,
  leaseTermLabel,
  localIsoDate,
  statusLabel,
} from '@/modules/rooms/utils/roomLabels';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAppearance } from '@/theme/ThemeProvider';

const REPORT_REASONS = [
  'Scam or fraud',
  'Misleading details',
  'Already rented',
  'Discrimination',
  'Inappropriate content',
  'Other',
];

const GALLERY_HEIGHT = 260;
const BOTTOM_BAR_SPACE = 96;

type OwnerAction = 'publish' | 'pause' | 'rented';

/** Public listing detail. Owners get edit and status actions; everyone else can save, contact, or report. */
export function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const { isSaved, toggle } = useRoomSave();
  const [saving, setSaving] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const roomQuery = useQuery({
    queryKey: ['rooms', 'detail', roomId],
    queryFn: () => getRoomDetail(roomId),
    enabled: Boolean(roomId),
    retry: (count, error) => !isNotFound(error) && count < 2,
  });
  const room = roomQuery.data;

  const imagesQuery = useQuery({
    queryKey: ['rooms', 'images', roomId],
    queryFn: () => listRoomImages(roomId),
    enabled: Boolean(room),
  });
  const amenitiesQuery = useQuery({
    queryKey: ['rooms', 'amenities'],
    queryFn: getRoomAmenities,
    staleTime: 10 * 60_000,
    enabled: (room?.amenities?.length ?? 0) > 0,
  });

  const ownerMutation = useMutation({
    mutationFn: (action: OwnerAction) =>
      action === 'publish'
        ? publishRoomListing(roomId)
        : action === 'pause'
          ? pauseRoomListing(roomId)
          : markRoomRented(roomId),
    onError: (error) => showError('Could not update listing', error),
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', roomId] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', 'listings'] }),
      ]),
  });

  if (roomQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading room…" />
      </Screen>
    );
  }

  if (roomQuery.isError || !room) {
    const notFound = isNotFound(roomQuery.error);
    return (
      <Screen>
        <BackButton fallback="/rooms" />
        <ErrorState
          body={
            notFound
              ? 'This listing was removed or is no longer available.'
              : errorMessage(roomQuery.error)
          }
          onRetry={notFound ? () => router.replace('/rooms' as Href) : () => roomQuery.refetch()}
          retryLabel={notFound ? 'Browse rooms' : 'Retry'}
          title={notFound ? 'Room not found' : 'Could not load this room'}
        />
      </Screen>
    );
  }

  const photoUrls = imagesQuery.data?.length
    ? imagesQuery.data.map((img) => img.url)
    : room.coverImageUrl
      ? [room.coverImageUrl]
      : [];
  const saved = isSaved(room);
  const isActive = statusIs(room.status, 'active');

  const handleSave = async () => {
    setSaving(true);
    try {
      await toggle(room);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: room.title,
        message: `${room.title} (${formatMoney(room.price, 'USD')}/mo) on ManaBandhu\nmanabandhu://rooms/${roomId}`,
        url: `manabandhu://rooms/${roomId}`,
      });
    } catch (error) {
      showError('Could not share this listing', error);
    }
  };

  const handleMessageHost = async () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    setContacting(true);
    try {
      const res = await inquireRoom(roomId, {
        moveInDate: localIsoDate(),
        stayDurationMonths: null,
        introMessage: `Hi! I'm interested in "${room.title}". Is it still available?`,
      });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      router.push(`/chat/${res.conversationId}` as Href);
    } catch (error) {
      showError('Could not contact the host', error);
    } finally {
      setContacting(false);
    }
  };

  return (
    <YStack backgroundColor="$background" flex={1}>
      <Screen bottomInset={BOTTOM_BAR_SPACE}>
        <YStack gap="$x4">
          <XStack alignItems="center" justifyContent="space-between">
            <BackButton fallback="/rooms" />
            <XStack gap="$x2">
              {!room.isOwner ? (
                <IconButton
                  icon="heart"
                  label={saving ? 'Saving…' : saved ? 'Remove from saved' : 'Save room'}
                  onPress={handleSave}
                  variant={saved ? 'solid' : 'tinted'}
                />
              ) : null}
              <IconButton icon="share" label="Share listing" onPress={handleShare} />
            </XStack>
          </XStack>

          <Gallery
            imagesError={imagesQuery.isError}
            onRetryImages={() => imagesQuery.refetch()}
            urls={photoUrls}
          />

          <YStack gap="$x2">
            <XStack flexWrap="wrap" gap="$x2">
              <Chip label={room.roomType} />
              {room.isOwner ? (
                <Chip label={`Your listing · ${statusLabel(room.status)}`} selected />
              ) : null}
              {room.isVerifiedHost ? <Chip icon="verified-user" label="Verified host" /> : null}
            </XStack>
            <AppText role="heading" variant="h2">
              {room.title}
            </AppText>
            {room.broadLocation ? (
              <XStack alignItems="center" gap="$x1">
                <AppIcon name="map-pin" size={16} />
                <AppText tone="muted">{room.broadLocation}</AppText>
              </XStack>
            ) : null}
          </YStack>

          <PricingCard room={room} />

          <Card gap="$x2" variant="outlined">
            <AppText role="heading" variant="h4">
              Household
            </AppText>
            <Fact label="Kitchen" value={dietaryLabel(room.dietaryPreference)} />
            <Fact label="Roommates" value={genderLabel(room.genderPreference)} />
            <Fact label="Bathroom" value={bathroomLabel(room.bathroomType)} />
            <Fact label="Lease" value={leaseTermLabel(room.leaseTerm)} />
            {room.universityShuttleAccessible ? (
              <Fact label="Transit" value="Host says it is near a university or shuttle stop" />
            ) : null}
          </Card>

          <Card gap="$x2" variant="outlined">
            <AppText role="heading" variant="h4">
              Amenities
            </AppText>
            {room.amenities?.length ? (
              <XStack flexWrap="wrap" gap="$x2">
                {room.amenities.map((value) => (
                  <Chip icon="check" key={value} label={amenityLabel(value, amenitiesQuery.data)} />
                ))}
              </XStack>
            ) : (
              <AppText tone="muted">No amenities listed</AppText>
            )}
          </Card>

          {room.description ? (
            <Card gap="$x2" variant="outlined">
              <AppText role="heading" variant="h4">
                About this home
              </AppText>
              <AppText>{room.description}</AppText>
            </Card>
          ) : null}

          <Card variant="tinted">
            <XStack alignItems="flex-start" gap="$x3">
              <AppIcon name="shield" size={20} />
              <YStack flex={1} gap={2}>
                <AppText variant="label">Approximate area only</AppText>
                <AppText tone="muted" variant="caption">
                  The map and location show the general area. Exact address is shared by the host in
                  chat.
                </AppText>
              </YStack>
            </XStack>
          </Card>

          {!room.isOwner ? (
            <XStack>
              <AppButton
                icon="warning"
                label="Report listing"
                onPress={() =>
                  isAuthenticated ? setReportOpen(true) : router.push('/sign-in' as Href)
                }
                size="sm"
                variant="ghost"
              />
            </XStack>
          ) : null}
        </YStack>
      </Screen>

      <XStack
        alignItems="center"
        backgroundColor="$surface"
        borderColor="$borderColor"
        borderTopWidth={1}
        bottom={0}
        gap="$x3"
        left={0}
        paddingBottom={Math.max(insets.bottom, 12)}
        paddingHorizontal="$x4"
        paddingTop="$x3"
        position="absolute"
        right={0}
      >
        {room.isOwner ? (
          <OwnerActions
            busy={ownerMutation.isPending}
            onAction={(action) => ownerMutation.mutate(action)}
            onEdit={() => router.push(`/rooms/${roomId}/edit` as Href)}
            status={room.status}
          />
        ) : (
          <>
            <YStack flex={1}>
              <AppText tone="primary" variant="h4">
                {formatMoney(room.price, 'USD')}/mo
              </AppText>
              {!isActive ? (
                <AppText tone="muted" variant="caption">
                  Not accepting inquiries
                </AppText>
              ) : null}
            </YStack>
            {isActive ? (
              <>
                <AppButton
                  label="Details"
                  onPress={() => router.push(`/rooms/${roomId}/inquiry` as Href)}
                  variant="secondary"
                />
                <AppButton
                  icon="message"
                  label="Message host"
                  loading={contacting}
                  onPress={handleMessageHost}
                />
              </>
            ) : null}
          </>
        )}
      </XStack>

      <ReportSheet onClose={() => setReportOpen(false)} roomId={roomId} visible={reportOpen} />
    </YStack>
  );
}

function Gallery({
  urls,
  imagesError,
  onRetryImages,
}: {
  urls: string[];
  imagesError: boolean;
  onRetryImages: () => void;
}) {
  const { palette } = useAppearance();
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(urls.length - 1, next));
    setIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  if (urls.length === 0) {
    return (
      <YStack
        alignItems="center"
        backgroundColor="$surfaceContainerLow"
        borderRadius="$card"
        gap="$x2"
        height={GALLERY_HEIGHT * 0.6}
        justifyContent="center"
      >
        <AppIcon color={palette.muted} name="bed" size={36} />
        <AppText tone="muted" variant="caption">
          {imagesError ? 'Photos could not be loaded' : 'No photos yet'}
        </AppText>
        {imagesError ? (
          <AppButton label="Retry" onPress={onRetryImages} size="sm" variant="ghost" />
        ) : null}
      </YStack>
    );
  }

  return (
    <YStack
      borderRadius="$card"
      height={GALLERY_HEIGHT}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      overflow="hidden"
      position="relative"
    >
      {width > 0 ? (
        <ScrollView
          horizontal
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1)))
          }
          pagingEnabled
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
        >
          {urls.map((url, i) => (
            <Image
              accessibilityLabel={`Room photo ${i + 1} of ${urls.length}`}
              key={url}
              resizeMode="cover"
              source={{ uri: url }}
              style={{ width, height: GALLERY_HEIGHT }}
            />
          ))}
        </ScrollView>
      ) : null}
      {urls.length > 1 ? (
        <>
          <YStack
            backgroundColor="$surface"
            borderRadius="$pill"
            paddingHorizontal="$x2"
            paddingVertical={2}
            position="absolute"
            right={12}
            top={12}
          >
            <AppText variant="caption">
              {index + 1} / {urls.length}
            </AppText>
          </YStack>
          {index > 0 ? (
            <YStack left={8} marginTop={-22} position="absolute" top="50%">
              <IconButton
                icon="chevron-left"
                label="Previous photo"
                onPress={() => goTo(index - 1)}
                variant="solid"
              />
            </YStack>
          ) : null}
          {index < urls.length - 1 ? (
            <YStack marginTop={-22} position="absolute" right={8} top="50%">
              <IconButton
                icon="chevron-right"
                label="Next photo"
                onPress={() => goTo(index + 1)}
                variant="solid"
              />
            </YStack>
          ) : null}
        </>
      ) : null}
    </YStack>
  );
}

function PricingCard({ room }: { room: RoomListing }) {
  const utilities = room.utilitiesIncluded
    ? 'Included in rent'
    : room.estUtilityMonthly != null
      ? `About ${formatMoney(room.estUtilityMonthly, 'USD')}/mo extra`
      : 'Not listed';
  return (
    <Card gap="$x2" variant="filled">
      <Fact label="Rent" value={`${formatMoney(room.price, 'USD')}/mo`} />
      <Fact label="Utilities" value={utilities} />
      {room.securityDeposit != null ? (
        <Fact label="Deposit" value={formatMoney(room.securityDeposit, 'USD')} />
      ) : null}
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <XStack gap="$x3" justifyContent="space-between">
      <AppText tone="muted" variant="label">
        {label}
      </AppText>
      <AppText flex={1} textAlign="right">
        {value}
      </AppText>
    </XStack>
  );
}

function OwnerActions({
  status,
  busy,
  onAction,
  onEdit,
}: {
  status: string;
  busy: boolean;
  onAction: (action: OwnerAction) => void;
  onEdit: () => void;
}) {
  const active = statusIs(status, 'active');
  const paused = statusIs(status, 'paused');
  const draft = statusIs(status, 'draft');
  const rented = statusIs(status, 'rented');
  return (
    <XStack flex={1} flexWrap="wrap" gap="$x2" justifyContent="flex-end">
      <AppButton
        disabled={busy}
        icon="settings"
        label="Edit"
        onPress={onEdit}
        variant="secondary"
      />
      {active ? (
        <AppButton
          loading={busy}
          label="Pause"
          onPress={() => onAction('pause')}
          variant="secondary"
        />
      ) : null}
      {active || paused ? (
        <AppButton
          disabled={busy}
          label="Mark rented"
          onPress={() => onAction('rented')}
          variant="secondary"
        />
      ) : null}
      {paused || draft ? (
        <AppButton loading={busy} label="Publish" onPress={() => onAction('publish')} />
      ) : null}
      {rented ? (
        <AppButton loading={busy} label="Relist" onPress={() => onAction('publish')} />
      ) : null}
    </XStack>
  );
}

function ReportSheet({
  roomId,
  visible,
  onClose,
}: {
  roomId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      reportRoom(roomId, { reason: reason ?? '', description: description.trim() || undefined }),
    onSuccess: () =>
      setResult({ ok: true, message: 'Report sent. A moderator will review this listing.' }),
    onError: (error) =>
      setResult({ ok: false, message: errorMessage(error, 'Could not send the report.') }),
  });

  const close = () => {
    onClose();
    if (result?.ok) {
      setReason(null);
      setDescription('');
    }
    setResult(null);
  };

  return (
    <BottomSheet
      onClose={close}
      subtitle="Tell us what is wrong. The host is not told who reported it."
      title="Report listing"
      visible={visible}
    >
      <YStack gap="$x3" paddingBottom="$x2">
        {result?.ok ? (
          <>
            <AppText aria-live="polite" tone="success" variant="label">
              {result.message}
            </AppText>
            <AppButton fullWidth label="Done" onPress={close} />
          </>
        ) : (
          <>
            <XStack aria-label="Reason" flexWrap="wrap" gap="$x2" role="radiogroup">
              {REPORT_REASONS.map((r) => (
                <Chip key={r} label={r} onPress={() => setReason(r)} selected={reason === r} />
              ))}
            </XStack>
            <TextField
              label="Details (optional)"
              maxLength={4000}
              multiline
              onChangeText={setDescription}
              placeholder="What should a moderator know?"
              value={description}
            />
            {result && !result.ok ? (
              <AppText aria-live="polite" tone="danger" variant="caption">
                {result.message}
              </AppText>
            ) : null}
            <AppButton
              disabled={!reason}
              fullWidth
              label="Send report"
              loading={mutation.isPending}
              onPress={() => mutation.mutate()}
              variant="danger"
            />
          </>
        )}
      </YStack>
    </BottomSheet>
  );
}

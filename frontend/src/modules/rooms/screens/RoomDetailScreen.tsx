import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Share } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useAuthStore } from '@/lib/authStore';
import {
  archiveRoomListing,
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
import { formatAmount, formatRent } from '@/modules/rooms/utils/roomFormat';
import {
  ARCHIVE_CONFIRM,
  amenityLabel,
  bathroomLabel,
  dietaryLabel,
  errorMessage,
  genderLabel,
  isNotFound,
  leaseTermLabel,
  localIsoDate,
  statusLabel,
  statusTone,
} from '@/modules/rooms/utils/roomLabels';
import { ErrorState } from '@/modules/shared/components/ErrorState';
import { LoadingState } from '@/modules/shared/components/LoadingState';
import { ACTION_BAR_SPACE, ActionBar } from '@/modules/shared/ui/ActionBar';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppIcon } from '@/modules/shared/ui/AppIcon';
import { AppText } from '@/modules/shared/ui/AppText';
import { BackButton } from '@/modules/shared/ui/BackButton';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { useConfirm } from '@/modules/shared/ui/ConfirmSheet';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { Screen } from '@/modules/shared/ui/Screen';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';
import { useAdaptiveLayout } from '@/platform/adaptive';
import { useAppearance } from '@/theme/ThemeProvider';

const REPORT_REASONS = [
  'Scam or fraud',
  'Misleading details',
  'Already rented',
  'Discrimination',
  'Inappropriate content',
  'Other',
];

const GALLERY_HEIGHT = 280;

type OwnerAction = 'publish' | 'pause' | 'rented' | 'archive';

const OWNER_ACTION_LABEL: Record<OwnerAction, string> = {
  publish: 'Publish',
  pause: 'Pause',
  rented: 'Mark rented',
  archive: 'Archive',
};

/** The one status action shown in the bar, and the others offered under "More". */
export function ownerStatusActions(status: string): {
  primary: OwnerAction | null;
  more: OwnerAction[];
} {
  if (statusIs(status, 'active')) return { primary: 'pause', more: ['rented', 'archive'] };
  if (statusIs(status, 'paused')) return { primary: 'publish', more: ['rented', 'archive'] };
  if (statusIs(status, 'draft')) return { primary: 'publish', more: ['archive'] };
  if (statusIs(status, 'rented')) return { primary: 'publish', more: ['archive'] };
  return { primary: null, more: [] };
}

/** Public listing detail. Owners get edit and status actions; everyone else can save, contact, or report. */
export function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const { isDualPane } = useAdaptiveLayout();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const { isSaved, toggle } = useRoomSave();
  const [saving, setSaving] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const confirm = useConfirm();
  const [pulling, setPulling] = useState(false);

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
    mutationFn: (action: OwnerAction) => {
      switch (action) {
        case 'publish':
          return publishRoomListing(roomId);
        case 'pause':
          return pauseRoomListing(roomId);
        case 'rented':
          return markRoomRented(roomId);
        case 'archive':
          return archiveRoomListing(roomId);
      }
    },
    onError: (error) => showError('Could not update listing', error),
    onSettled: () =>
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', roomId] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', 'my-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', 'listings'] }),
      ]),
  });

  const runMoreAction = async (action: OwnerAction) => {
    setMoreOpen(false);
    if (action === 'archive' && !(await confirm(ARCHIVE_CONFIRM))) return;
    ownerMutation.mutate(action);
  };

  const refresh = async () => {
    setPulling(true);
    try {
      await Promise.allSettled([roomQuery.refetch(), imagesQuery.refetch()]);
    } finally {
      setPulling(false);
    }
  };

  if (roomQuery.isLoading) {
    return (
      <Screen>
        <BackButton fallback="/rooms" />
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
  const ownerActions = ownerStatusActions(room.status);

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
        message: `${room.title} (${formatRent(room.price)}) on ManaBandhu\nmanabandhu://rooms/${roomId}`,
        url: `manabandhu://rooms/${roomId}`,
      });
    } catch (error) {
      showError('Could not share this listing', error);
    }
  };

  const openInquiry = () =>
    router.push((isAuthenticated ? `/rooms/${roomId}/inquiry` : '/sign-in') as Href);

  /** One-tap "Is it still available?" inquiry that opens the chat with the host. */
  const handleQuickHello = async () => {
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

  const summary = (
    <YStack gap="$x2">
      <XStack alignItems="center" flexWrap="wrap" gap="$x2">
        <Chip label={room.roomType} variant="tag" />
        {room.isOwner ? (
          <StatusBadge
            label={`Your listing · ${statusLabel(room.status)}`}
            tone={statusTone(room.status)}
          />
        ) : null}
        {room.isVerifiedHost ? (
          <StatusBadge icon="verified-user" label="Verified host" tone="success" />
        ) : null}
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
  );

  const facts = (
    <>
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
              <Chip
                icon="check"
                key={value}
                label={amenityLabel(value, amenitiesQuery.data)}
                variant="tag"
              />
            ))}
          </XStack>
        ) : (
          <AppText tone="muted">No amenities listed</AppText>
        )}
      </Card>
    </>
  );

  const about = (
    <>
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
              The listing shows the general area, never the street address. The host shares the
              exact address in chat.
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
    </>
  );

  const gallery = (
    <Gallery
      imagesError={imagesQuery.isError}
      onRetryImages={() => imagesQuery.refetch()}
      urls={photoUrls}
    />
  );

  return (
    <YStack backgroundColor="$background" flex={1}>
      <Screen bottomInset={ACTION_BAR_SPACE} onRefresh={refresh} refreshing={pulling}>
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

          {isDualPane ? (
            <XStack alignItems="flex-start" gap="$x6">
              <YStack flex={3} gap="$x4" minWidth={0}>
                {gallery}
                {summary}
                {about}
              </YStack>
              <YStack flex={2} gap="$x4" minWidth={0}>
                {facts}
              </YStack>
            </XStack>
          ) : (
            <>
              {gallery}
              {summary}
              {facts}
              {about}
            </>
          )}
        </YStack>
      </Screen>

      {room.isOwner ? (
        <ActionBar label="Listing actions">
          <XStack flex={1} flexWrap="wrap" gap="$x2" justifyContent="flex-end">
            <AppButton
              disabled={ownerMutation.isPending}
              icon="pencil"
              label="Edit"
              onPress={() => router.push(`/rooms/${roomId}/edit` as Href)}
              variant="secondary"
            />
            {ownerActions.primary ? (
              <AppButton
                label={
                  statusIs(room.status, 'rented')
                    ? 'Relist'
                    : OWNER_ACTION_LABEL[ownerActions.primary]
                }
                loading={ownerMutation.isPending}
                onPress={() => ownerActions.primary && ownerMutation.mutate(ownerActions.primary)}
              />
            ) : null}
            {ownerActions.more.length ? (
              <IconButton
                disabled={ownerMutation.isPending}
                icon="more"
                label="More listing actions"
                onPress={() => setMoreOpen(true)}
              />
            ) : null}
          </XStack>
        </ActionBar>
      ) : (
        <ActionBar
          label="Room actions"
          leading={
            <>
              <AppText tone="primary" variant="h4">
                {formatRent(room.price)}
              </AppText>
              {!isActive ? (
                <AppText tone="muted" variant="caption">
                  Not accepting inquiries
                </AppText>
              ) : null}
            </>
          }
        >
          {isActive ? (
            // One group, so on a phone both buttons wrap together under the price instead of splitting.
            <XStack flexGrow={1} gap="$x2" justifyContent="flex-end">
              <AppButton
                disabled={contacting}
                label="Quick hello"
                loading={contacting}
                onPress={handleQuickHello}
                variant="secondary"
              />
              <AppButton icon="message" label="Contact host" onPress={openInquiry} />
            </XStack>
          ) : null}
        </ActionBar>
      )}

      {room.isOwner ? (
        <BottomSheet onClose={() => setMoreOpen(false)} title="Listing actions" visible={moreOpen}>
          <YStack gap="$x2" paddingBottom="$x2">
            {ownerActions.more.map((action) => (
              <AppButton
                fullWidth
                key={action}
                label={OWNER_ACTION_LABEL[action]}
                onPress={() => runMoreAction(action)}
                variant={action === 'archive' ? 'danger' : 'secondary'}
              />
            ))}
            <AppButton
              fullWidth
              label="Manage all my listings"
              onPress={() => {
                setMoreOpen(false);
                router.push('/rooms/my-listings' as Href);
              }}
              variant="ghost"
            />
          </YStack>
        </BottomSheet>
      ) : null}

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
              cachePolicy="memory-disk"
              contentFit="cover"
              key={url}
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
      ? `About ${formatRent(room.estUtilityMonthly)} extra`
      : 'Not listed';
  return (
    <Card gap="$x2" variant="filled">
      <Fact label="Rent" value={formatRent(room.price)} />
      <Fact label="Utilities" value={utilities} />
      {room.securityDeposit != null ? (
        <Fact label="Deposit" value={formatAmount(room.securityDeposit)} />
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
                <Chip
                  key={r}
                  label={r}
                  onPress={() => setReason(r)}
                  radio
                  selected={reason === r}
                />
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

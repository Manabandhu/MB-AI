import { formatDate } from '@manabandhu/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { YStack } from 'tamagui';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';
import { Card } from '@/modules/shared/ui/Card';
import { Chip } from '@/modules/shared/ui/Chip';
import { DateTimeField } from '@/modules/shared/ui/DateTimeField';
import { EmptyState } from '@/modules/shared/ui/EmptyState';
import { ErrorState } from '@/modules/shared/ui/ErrorState';
import { FilterChipRow } from '@/modules/shared/ui/FilterChipRow';
import { IconButton } from '@/modules/shared/ui/IconButton';
import { LoadingState } from '@/modules/shared/ui/LoadingState';
import { Screen } from '@/modules/shared/ui/Screen';
import { ScreenHeader } from '@/modules/shared/ui/ScreenHeader';
import { StatusBadge } from '@/modules/shared/ui/StatusBadge';
import { TextField } from '@/modules/shared/ui/TextField';
import { createPackage, getPackages, type PackageStatus } from '@/modules/utilities/api';
import {
  matchesSearch,
  PACKAGE_STATUSES,
  packageStatus,
  trackingNumberError,
} from '@/modules/utilities/utils/utilitiesFormat';

const CARRIERS = ['USPS', 'UPS', 'FedEx', 'Amazon', 'DHL'] as const;

function AddPackageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState<string>('USPS');
  const [otherCarrier, setOtherCarrier] = useState('');
  const [status, setStatus] = useState<PackageStatus>('IN_TRANSIT');
  const [eta, setEta] = useState<Date | null>(null);
  const [touched, setTouched] = useState(false);

  const carrierName = carrier === 'Other' ? otherCarrier.trim() : carrier;
  const numberError = touched ? trackingNumberError(trackingNumber) : null;
  const carrierError = touched && !carrierName ? 'Enter the carrier.' : null;

  const add = useMutation({
    mutationFn: () =>
      createPackage({
        trackingNumber: trackingNumber.trim(),
        carrier: carrierName.slice(0, 80),
        status,
        estimatedDelivery: eta ? eta.toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilities'] });
      setTrackingNumber('');
      setOtherCarrier('');
      setEta(null);
      setTouched(false);
      onClose();
    },
  });

  const submit = () => {
    setTouched(true);
    if (trackingNumberError(trackingNumber) || !carrierName) return;
    add.mutate();
  };

  return (
    <BottomSheet
      onClose={onClose}
      scrollable
      subtitle="Keep your deliveries in one list. Status is what you enter here."
      title="Add a package"
      visible={visible}
    >
      <YStack gap="$x4">
        <TextField
          autoCapitalize="characters"
          autoCorrect={false}
          error={numberError}
          label="Tracking number"
          maxLength={80}
          onChangeText={setTrackingNumber}
          value={trackingNumber}
        />
        <YStack gap="$x2">
          <AppText variant="label">Carrier</AppText>
          <FilterChipRow label="Carrier" role="radiogroup">
            {[...CARRIERS, 'Other'].map((c) => (
              <Chip
                key={c}
                label={c}
                onPress={() => setCarrier(c)}
                radio
                selected={carrier === c}
              />
            ))}
          </FilterChipRow>
          {carrier === 'Other' ? (
            <TextField
              error={carrierError}
              label="Carrier name"
              maxLength={80}
              onChangeText={setOtherCarrier}
              value={otherCarrier}
            />
          ) : null}
        </YStack>
        <YStack gap="$x2">
          <AppText variant="label">Status</AppText>
          <FilterChipRow label="Status" role="radiogroup">
            {PACKAGE_STATUSES.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                onPress={() => setStatus(s.value)}
                radio
                selected={status === s.value}
              />
            ))}
          </FilterChipRow>
        </YStack>
        <DateTimeField
          helper="Optional"
          label="Expected delivery"
          minimumDate={new Date()}
          mode="date"
          onChange={setEta}
          value={eta}
        />
        {add.isError ? (
          <AppText role="alert" tone="danger" variant="caption">
            {add.error instanceof Error ? add.error.message : 'Could not add the package.'} Please
            try again.
          </AppText>
        ) : null}
        <AppButton
          fullWidth
          label="Add package"
          loading={add.isPending}
          onPress={submit}
          size="lg"
        />
      </YStack>
    </BottomSheet>
  );
}

/** Your tracked packages with their status, plus a form to add one. */
export function PackageTrackingScreen() {
  const packages = useQuery({ queryKey: ['utilities', 'packages'], queryFn: getPackages });
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const data = packages.data ?? [];

  const filtered = useMemo(
    () =>
      data.filter((item) =>
        matchesSearch(search, [
          item.trackingNumber,
          item.carrier,
          packageStatus(item.status).label,
        ]),
      ),
    [data, search],
  );

  const body = () => {
    if (packages.isLoading) return <LoadingState count={4} variant="skeleton" />;
    if (packages.isError) {
      return (
        <ErrorState
          body="Check your connection and try again."
          onRetry={() => packages.refetch()}
          retryLabel="Retry"
          title="Unable to load packages"
        />
      );
    }
    if (data.length === 0) {
      return (
        <EmptyState
          actionLabel="Add a package"
          body="Add a tracking number to keep your deliveries in one place."
          iconName="package"
          onAction={() => setAdding(true)}
          title="No packages yet"
        />
      );
    }
    return (
      <YStack gap="$x3">
        <TextField
          aria-label="Search packages"
          leadingIcon="search"
          onChangeText={setSearch}
          placeholder="Search by number, carrier, or status"
          trailing={
            search ? (
              <IconButton
                icon="close"
                label="Clear search"
                onPress={() => setSearch('')}
                variant="plain"
              />
            ) : undefined
          }
          value={search}
        />
        {filtered.length === 0 ? (
          <EmptyState
            actionLabel="Clear search"
            body="No packages match that search."
            compact
            onAction={() => setSearch('')}
            title="No matches"
          />
        ) : (
          filtered.map((item) => {
            const status = packageStatus(item.status);
            return (
              <Card key={item.id}>
                <StatusBadge icon="package" label={status.label} tone={status.tone} />
                <AppText selectable variant="bodyStrong">
                  {item.trackingNumber}
                </AppText>
                <AppText tone="muted" variant="caption">
                  {[
                    item.carrier,
                    item.estimatedDelivery
                      ? `expected ${formatDate(item.estimatedDelivery, 'short')}`
                      : null,
                    `updated ${formatDate(item.lastUpdate, 'short')}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </Card>
            );
          })
        )}
      </YStack>
    );
  };

  return (
    <Screen
      keyboardAvoiding
      onRefresh={() => packages.refetch()}
      refreshing={packages.isRefetching}
    >
      <ScreenHeader
        back={{ fallback: '/utilities' as Href }}
        primaryAction={{ label: 'Add package', icon: 'plus', onPress: () => setAdding(true) }}
        subtitle="Deliveries you are expecting."
        title="Packages"
      />
      {body()}
      <AddPackageSheet onClose={() => setAdding(false)} visible={adding} />
    </Screen>
  );
}

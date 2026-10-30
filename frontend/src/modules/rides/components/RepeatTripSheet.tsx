import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { reactivateRideOffer } from '@/modules/rides/api';
import { DeparturePicker, type DepartureValue } from '@/modules/rides/components/DeparturePicker';
import type { Ride } from '@/modules/rides/types';
import { showError } from '@/modules/rides/utils/notify';
import {
  departureError,
  departureFrom,
  nextDepartureAtSameTime,
} from '@/modules/rides/utils/rideFormat';
import { AppButton } from '@/modules/shared/ui/AppButton';
import { AppText } from '@/modules/shared/ui/AppText';
import { BottomSheet } from '@/modules/shared/ui/BottomSheet';

/**
 * "Repeat trip": the driver picks the new departure (defaulting to the original time of day on the next day) and
 * the backend posts a copy of the ride. Nothing is posted until the driver confirms a future time.
 */
export function RepeatTripSheet({
  ride,
  onClose,
  onPosted,
}: {
  ride: Ride | null;
  onClose: () => void;
  onPosted: (newRide: Ride) => void;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState<DepartureValue>({ dayOffset: 1, hour: 9, minute: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ride) return;
    const next = nextDepartureAtSameTime(ride.departureAt);
    setValue({ dayOffset: next.dayOffset, hour: next.hour, minute: next.minute });
    setError(null);
  }, [ride]);

  const mutation = useMutation({
    mutationFn: ({ id, at }: { id: string; at: string }) => reactivateRideOffer(id, at),
    onSuccess: (newRide) => {
      Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'history'] }),
        queryClient.invalidateQueries({ queryKey: ['rides', 'offers'] }),
      ]);
      onPosted(newRide);
    },
    onError: (e) => showError('Could not repeat this trip', e),
  });

  const submit = () => {
    if (!ride) return;
    const at = departureFrom(value.dayOffset, value.hour, value.minute);
    const problem = departureError(at);
    setError(problem);
    if (problem) return;
    mutation.mutate({ id: ride.id, at: at.toISOString() });
  };

  return (
    <BottomSheet
      onClose={onClose}
      subtitle={ride?.routeLabel}
      title="Repeat this trip"
      visible={Boolean(ride)}
    >
      <YStack gap="$x4" paddingBottom="$x2">
        <AppText tone="muted" variant="caption">
          Posts a new ride with the same route, seats and price at the time you choose.
        </AppText>
        <DeparturePicker
          error={error}
          onChange={(v) => {
            setValue(v);
            setError(null);
          }}
          value={value}
        />
        <AppButton
          fullWidth
          label="Post repeat trip"
          loading={mutation.isPending}
          onPress={submit}
        />
        <AppButton fullWidth label="Cancel" onPress={onClose} variant="ghost" />
      </YStack>
    </BottomSheet>
  );
}

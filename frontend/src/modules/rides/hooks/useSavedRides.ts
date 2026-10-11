import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { useMemo } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { getSavedRides, saveRide, unsaveRide } from '@/modules/rides/api';
import { showError } from '@/modules/rides/utils/notify';
import { isJoinedRide } from '@/modules/rides/utils/rideFormat';

/**
 * The signed-in user's bookmarks (`GET /rides/saved`) and a heart toggle. Signed-out viewers are sent to sign in.
 * Rides the viewer rides on are "Joined", not saved (see `isJoinedRide`). The heart reflects the server list only; a failed save or unsave is reported and the list is refetched.
 */
export function useSavedRides() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const query = useQuery({
    queryKey: ['rides', 'saved'],
    queryFn: getSavedRides,
    enabled: isAuthenticated,
  });
  // Joined rides come back from `/saved` too but are not bookmarks (unsaving them is a no-op), so they never count.
  const savedIds = useMemo(
    () => new Set((query.data ?? []).filter((r) => !isJoinedRide(r)).map((r) => r.id)),
    [query.data],
  );

  const mutation = useMutation({
    mutationFn: async ({ id, save }: { id: string; save: boolean }) => {
      if (save) await saveRide(id);
      else await unsaveRide(id);
    },
    onError: (e, { save }) =>
      showError(save ? 'Could not save ride' : 'Could not remove saved ride', e),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rides', 'saved'] }),
  });

  const toggle = (rideId: string) => {
    if (!isAuthenticated) {
      router.push('/sign-in' as Href);
      return;
    }
    mutation.mutate({ id: rideId, save: !savedIds.has(rideId) });
  };

  return {
    query,
    savedIds,
    isSaved: (rideId: string) => savedIds.has(rideId),
    toggle,
    pendingId: mutation.isPending ? mutation.variables?.id : undefined,
  };
}

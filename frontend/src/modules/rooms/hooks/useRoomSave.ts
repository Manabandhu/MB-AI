import { useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useSavedRoomsStore } from '@/modules/rooms/stores/savedRoomsStore';
import { showError } from '@/modules/shared/ui/notify';

const EMPTY: Record<string, boolean> = {};

/**
 * Save/unsave for the signed-in user. Shows the optimistic choice while the request runs, rolls back and alerts
 * on failure, and refetches every rooms query that carries `savedByViewer`. Signed-out viewers go to sign-in.
 */
export function useRoomSave() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const overrides = useSavedRoomsStore((s) =>
    userId && s.userId === userId ? s.overrides : EMPTY,
  );
  const setSaved = useSavedRoomsStore((s) => s.setSaved);
  const forget = useSavedRoomsStore((s) => s.forget);

  const isSaved = useCallback(
    (room: { id: string; savedByViewer?: boolean }) =>
      overrides[room.id] ?? Boolean(room.savedByViewer),
    [overrides],
  );

  const toggle = useCallback(
    async (room: { id: string; savedByViewer?: boolean }) => {
      if (!userId) {
        router.push('/sign-in' as Href);
        return;
      }
      const next = !(overrides[room.id] ?? Boolean(room.savedByViewer));
      let succeeded = false;
      try {
        await setSaved(userId, room.id, next);
        succeeded = true;
      } catch (error) {
        showError(next ? 'Could not save room' : 'Could not remove saved room', error);
      }
      // Refetch the server truth, then drop the optimistic entry so it never outlives the real data.
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['rooms', 'favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', 'listings'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms', 'detail', room.id] }),
      ]);
      if (succeeded) forget(room.id);
    },
    [forget, overrides, queryClient, setSaved, userId],
  );

  return { isSaved, toggle, isSignedIn: Boolean(userId) };
}

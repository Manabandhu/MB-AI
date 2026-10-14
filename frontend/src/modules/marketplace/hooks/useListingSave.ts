import { useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { create } from 'zustand';
import { useAuthStore } from '@/lib/authStore';
import { favoriteMarketplaceListing, unfavoriteMarketplaceListing } from '../api';
import { showError } from '../utils/notify';

/**
 * In-memory optimistic save choices, keyed to the user who made them. The server (`savedByViewer`) stays the source
 * of truth: an entry only overrides it while the request runs and until the refetch lands. Not persisted, and
 * ignored when a different user is signed in.
 */
type SaveOverrides = {
  userId: string | null;
  overrides: Record<string, boolean>;
  set: (userId: string, listingId: string, saved: boolean | undefined) => void;
};

const useSaveOverrides = create<SaveOverrides>()((set) => ({
  userId: null,
  overrides: {},
  set: (userId, listingId, saved) =>
    set((state) => {
      const next = state.userId === userId ? { ...state.overrides } : {};
      if (saved === undefined) delete next[listingId];
      else next[listingId] = saved;
      return { userId, overrides: next };
    }),
}));

const EMPTY: Record<string, boolean> = {};

/**
 * Save/unsave for the signed-in user with an optimistic heart. On failure the choice rolls back and the error is
 * shown; either way every marketplace query that carries `savedByViewer` is refetched. Signed-out viewers go to
 * sign-in.
 */
export function useListingSave() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const overrides = useSaveOverrides((s) => (userId && s.userId === userId ? s.overrides : EMPTY));
  const setOverride = useSaveOverrides((s) => s.set);
  const inFlight = useRef(new Set<string>());

  const isSaved = useCallback(
    (listing: { id: string; savedByViewer?: boolean }) =>
      overrides[listing.id] ?? Boolean(listing.savedByViewer),
    [overrides],
  );

  const toggle = useCallback(
    async (listing: { id: string; savedByViewer?: boolean }) => {
      if (!userId) {
        router.push('/sign-in' as Href);
        return;
      }
      if (inFlight.current.has(listing.id)) return;
      inFlight.current.add(listing.id);
      const previous = overrides[listing.id];
      const next = !(previous ?? Boolean(listing.savedByViewer));
      setOverride(userId, listing.id, next);
      try {
        if (next) await favoriteMarketplaceListing(listing.id);
        else await unfavoriteMarketplaceListing(listing.id);
      } catch (error) {
        setOverride(userId, listing.id, previous);
        inFlight.current.delete(listing.id);
        showError(next ? 'Could not save listing' : 'Could not remove saved listing', error);
        return;
      }
      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] }),
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'saved'] }),
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', listing.id] }),
      ]);
      // The refetched data now carries the server truth; drop the optimistic entry.
      setOverride(userId, listing.id, undefined);
      inFlight.current.delete(listing.id);
    },
    [overrides, queryClient, setOverride, userId],
  );

  return { isSaved, toggle, isSignedIn: Boolean(userId) };
}

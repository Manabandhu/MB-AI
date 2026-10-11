import { useDeferredValue, useMemo } from 'react';
import { create } from 'zustand';
import type { RoomListing } from '@/modules/rooms/types';
import {
  activeFilterCount,
  type CityFilter,
  DEFAULT_ROOM_FILTERS,
  hasActiveFilters,
  type RoomFilters,
  selectRooms,
} from '@/modules/rooms/utils/roomFilters';

type RoomFilterStore = {
  filters: RoomFilters;
  update: (patch: Partial<RoomFilters>) => void;
  reset: () => void;
};

/**
 * One filter state for `/rooms`, `/rooms/search`, `/rooms/map` and `/rooms/filters` (session only, not persisted), so
 * quick chips, the filter sheet and the drawn map area always agree and survive moving between those routes.
 */
const useRoomFilterStore = create<RoomFilterStore>()((set) => ({
  filters: DEFAULT_ROOM_FILTERS,
  update: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  reset: () => set({ filters: DEFAULT_ROOM_FILTERS }),
}));

export function useRoomFilters() {
  const filters = useRoomFilterStore((s) => s.filters);
  const update = useRoomFilterStore((s) => s.update);
  const reset = useRoomFilterStore((s) => s.reset);
  const activeCount = useMemo(() => activeFilterCount(filters), [filters]);
  const isFiltered = useMemo(() => hasActiveFilters(filters), [filters]);
  return { filters, update, reset, activeCount, isFiltered };
}

/** Rooms in the chosen city, and those that also pass the filters (sorted). Recomputed only when inputs change. */
export function useFilteredRooms(
  listings: readonly RoomListing[] | undefined,
  city: CityFilter,
  filters: RoomFilters,
) {
  // Typing stays responsive: the search text feeds the (up to 500-row) filter at lower priority.
  const query = useDeferredValue(filters.query);
  const effective = useMemo(() => ({ ...filters, query }), [filters, query]);
  return useMemo(() => selectRooms(listings ?? [], city, effective), [listings, city, effective]);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/**
 * Keeps public, non-personal query results (Home widgets and shell counts) on the device so Home paints instantly
 * on the next launch and on slow networks, then refreshes. Only queries marked `meta: { persist: true }` are saved;
 * chats, inboxes, and anything personal never are. The cache is wiped whenever the signed-in member changes.
 */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'manabandhu-query-cache',
  throttleTime: 2_000,
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: queryPersister,
  maxAge: 24 * 60 * 60 * 1000,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && query.meta?.persist === true,
  },
};

/** Marks a query as safe to keep on the device (public listings and aggregate counts only). */
export const persistMeta = { persist: true } as const;

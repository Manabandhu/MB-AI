/**
 * Splits large values across several keys of a size-limited key/value store (Expo SecureStore caps values at
 * roughly 2 KB, and a Supabase session regularly exceeds that). The base key holds the chunk count; values
 * written before chunking existed are still readable because a non-numeric base value is returned as-is.
 */
export type AsyncKeyValueStore = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export const DEFAULT_CHUNK_SIZE = 1800;

const chunkKey = (key: string, index: number) => `${key}.chunk${index}`;
const isCount = (value: string | null): value is string => value !== null && /^\d+$/.test(value);

export function createChunkedStorage(store: AsyncKeyValueStore, chunkSize = DEFAULT_CHUNK_SIZE) {
  async function removeChunks(key: string) {
    const head = await store.getItemAsync(key);
    const count = isCount(head) ? Number(head) : 0;
    await Promise.all(
      Array.from({ length: count }, (_, i) => store.deleteItemAsync(chunkKey(key, i))),
    );
    await store.deleteItemAsync(key);
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const head = await store.getItemAsync(key);
      if (head === null) return null;
      if (!isCount(head) || Number(head) <= 0) return head;
      const parts = await Promise.all(
        Array.from({ length: Number(head) }, (_, i) => store.getItemAsync(chunkKey(key, i))),
      );
      return parts.some((part) => part === null) ? null : parts.join('');
    },
    async setItem(key: string, value: string): Promise<void> {
      await removeChunks(key);
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += chunkSize) chunks.push(value.slice(i, i + chunkSize));
      if (chunks.length === 0) chunks.push('');
      await Promise.all(chunks.map((chunk, i) => store.setItemAsync(chunkKey(key, i), chunk)));
      await store.setItemAsync(key, String(chunks.length));
    },
    removeItem: (key: string) => removeChunks(key),
  };
}

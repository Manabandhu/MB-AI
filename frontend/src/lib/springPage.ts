/**
 * Paged backend responses. The backend serializes Spring Data `Page<T>` as `PagedModel`
 * (`spring.data.web.pageable.serialization-mode: via-dto`):
 *
 *   { "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }
 *
 * There is no `last`/`first`/`numberOfElements`. `toPage` turns that body into one stable shape for screens.
 * It still reads the older flat `PageImpl` body and a bare array, so a client talking to an older backend keeps working.
 */
export type Page<T> = {
  content: T[];
  /** Zero-based page index. */
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  /** True when this is the final page (`number + 1 >= totalPages`). */
  last: boolean;
};

type PageMetadata = {
  size?: number;
  number?: number;
  totalElements?: number;
  totalPages?: number;
};

/** The raw wire shape: `PagedModel` (nested `page`), legacy flat `PageImpl`, or a plain array. */
export type RawPage<T> =
  | T[]
  | (PageMetadata & {
      content?: T[] | null;
      page?: PageMetadata | null;
      last?: boolean;
    });

function count(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/**
 * Normalizes a paged response. `requestedPage`/`requestedSize` fill in only when the body omits them.
 * Throws when the body is not a page at all, so callers surface an error instead of an empty list.
 */
export function toPage<T>(
  data: RawPage<T> | null | undefined,
  requestedPage = 0,
  requestedSize?: number,
): Page<T> {
  if (Array.isArray(data)) {
    return {
      content: data,
      number: requestedPage,
      size: requestedSize ?? data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      last: true,
    };
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.content)) {
    throw new Error('Unexpected page response from the server.');
  }
  const content = data.content;
  const meta: PageMetadata = data.page ?? data;
  const number = count(meta.number) ?? requestedPage;
  const size = count(meta.size) ?? requestedSize ?? content.length;
  const totalElements = count(meta.totalElements) ?? number * size + content.length;
  const totalPages =
    count(meta.totalPages) ??
    (size > 0 ? Math.ceil(totalElements / size) : content.length > 0 ? 1 : 0);
  const last = typeof data.last === 'boolean' && !data.page ? data.last : number + 1 >= totalPages;
  return { content, number, size, totalElements, totalPages, last };
}

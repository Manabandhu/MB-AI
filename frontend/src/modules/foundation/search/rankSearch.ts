// Pure ranking for the global search screen. Kept free of React Native imports so it runs under `node --test`.

export type SearchFields = {
  title: string;
  /** City, area, or venue. */
  location?: string | null;
  /** Company, organiser, or other short secondary text. */
  secondary?: string | null;
  description?: string | null;
};

/** Weights: a title match always beats a location match, which beats secondary text, which beats the description. */
const TITLE_PREFIX = 100;
const TITLE_WORD = 85;
const TITLE_ANY = 70;
const LOCATION = 45;
const SECONDARY = 35;
const DESCRIPTION = 15;

function words(query: string) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function fieldScore(value: string | null | undefined, term: string) {
  return value ? value.toLowerCase().includes(term) : false;
}

function titleScore(title: string, term: string) {
  const t = title.toLowerCase();
  if (t.startsWith(term)) return TITLE_PREFIX;
  if (new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t)) {
    return TITLE_WORD;
  }
  return t.includes(term) ? TITLE_ANY : 0;
}

/**
 * Scores one item against the query (0 = no match). Every word in the query must appear in some field; the score
 * is the sum of each word's best field, plus a bonus when the whole phrase is in the title.
 */
export function scoreSearchMatch(query: string, fields: SearchFields): number {
  const terms = words(query);
  if (terms.length === 0) return 0;
  let total = 0;
  for (const term of terms) {
    const best = Math.max(
      titleScore(fields.title, term),
      fieldScore(fields.location, term) ? LOCATION : 0,
      fieldScore(fields.secondary, term) ? SECONDARY : 0,
      fieldScore(fields.description, term) ? DESCRIPTION : 0,
    );
    if (best === 0) return 0;
    total += best;
  }
  const phrase = query.trim().toLowerCase();
  if (terms.length > 1 && fields.title.toLowerCase().includes(phrase)) total += TITLE_PREFIX;
  return total;
}

/** Keeps the matching items, best first; ties keep their original order. */
export function rankSearchResults<T>(
  query: string,
  items: readonly T[],
  fieldsOf: (item: T) => SearchFields,
): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreSearchMatch(query, fieldsOf(item)) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

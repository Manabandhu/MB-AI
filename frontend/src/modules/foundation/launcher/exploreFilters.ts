import type { ModuleCategory } from '@manabandhu/core';

/**
 * Pure search, filter and grouping rules for the Explore directory. No React or app imports, so any client surface
 * can reuse them and `frontend/test/exploreFilters.test.mjs` runs them under plain Node.
 */

export type ExploreCategory = ModuleCategory | 'all';

/** Launcher categories in display order (chips and section order). */
export const exploreCategories: readonly { key: ModuleCategory; label: string }[] = [
  { key: 'living', label: 'Living & getting around' },
  { key: 'career', label: 'Career' },
  { key: 'community', label: 'Community' },
  { key: 'essentials', label: 'Essentials' },
  { key: 'safety', label: 'Safety' },
];

export type ExploreModule = {
  key: string;
  label: string;
  summary: string;
  category: ModuleCategory;
  defaultRank: number;
  keywords?: readonly string[];
};

export type ExploreSection<T> = { category: ModuleCategory; label: string; modules: T[] };

export function categoryLabel(category: ModuleCategory): string {
  return exploreCategories.find((c) => c.key === category)?.label ?? category;
}

/**
 * Lowercases, strips accents, and drops punctuation inside words so "H-1B", "h1b" and "H1B" match, and "&" or "/"
 * never decide a match.
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-'’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function searchWords(module: ExploreModule): string[] {
  const text = [
    module.label,
    module.summary,
    categoryLabel(module.category),
    ...(module.keywords ?? []),
  ].join(' ');
  return normalizeSearch(text).split(' ').filter(Boolean);
}

/**
 * True when every term in `query` starts a word in the module's label, summary, category label, or keywords
 * ("air" finds Rides through "airport"; "green card" needs both words). An empty query matches everything.
 */
export function matchesQuery(module: ExploreModule, query: string): boolean {
  const terms = normalizeSearch(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const words = searchWords(module);
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

/** Label matches first, then everything else; `defaultRank` breaks ties so the order is stable. */
function relevance(module: ExploreModule, query: string): number {
  const q = normalizeSearch(query);
  if (!q) return 0;
  const label = normalizeSearch(module.label);
  if (label === q) return 0;
  if (label.startsWith(q)) return 1;
  if (label.split(' ').some((word) => word.startsWith(q))) return 2;
  return 3;
}

/** Modules in `category` (or all) whose text matches `query`, most relevant first. */
export function filterModules<T extends ExploreModule>(
  modules: readonly T[],
  query: string,
  category: ExploreCategory,
): T[] {
  return modules
    .filter((m) => (category === 'all' || m.category === category) && matchesQuery(m, query))
    .map((module) => ({ module, score: relevance(module, query) }))
    .sort((a, b) => a.score - b.score || a.module.defaultRank - b.module.defaultRank)
    .map((entry) => entry.module);
}

/** How many modules match `query` in each category, plus `all`. Drives the counts on the category chips. */
export function countByCategory(
  modules: readonly ExploreModule[],
  query: string,
): Record<ExploreCategory, number> {
  const counts = { all: 0 } as Record<ExploreCategory, number>;
  for (const { key } of exploreCategories) counts[key] = 0;
  for (const module of modules) {
    if (!matchesQuery(module, query)) continue;
    counts.all += 1;
    counts[module.category] = (counts[module.category] ?? 0) + 1;
  }
  return counts;
}

/** Sections in category order (empty ones skipped), each sorted by `defaultRank`. */
export function groupByCategory<T extends ExploreModule>(
  modules: readonly T[],
): ExploreSection<T>[] {
  return exploreCategories
    .map(({ key, label }) => ({
      category: key,
      label,
      modules: modules
        .filter((m) => m.category === key)
        .sort((a, b) => a.defaultRank - b.defaultRank),
    }))
    .filter((section) => section.modules.length > 0);
}

/** The member's most recently opened modules (newest first, unique, unknown ids skipped). */
export function recentModules<T extends { key: string }>(
  modules: readonly T[],
  recentVisits: readonly { moduleId: string }[],
  limit = 4,
): T[] {
  const result: T[] = [];
  for (const visit of recentVisits) {
    if (result.length >= limit) break;
    const module = modules.find((m) => m.key === visit.moduleId);
    if (module && !result.includes(module)) result.push(module);
  }
  return result;
}

/** "3 features", "1 feature for “visa”", "2 features in Career". */
export function resultSummary(count: number, query: string, category: ExploreCategory): string {
  const noun = count === 1 ? 'feature' : 'features';
  const q = query.trim();
  const parts = [`${count} ${noun}`];
  if (q) parts.push(`for “${q}”`);
  if (category !== 'all') parts.push(`in ${categoryLabel(category)}`);
  return parts.join(' ');
}

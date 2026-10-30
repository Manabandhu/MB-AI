/**
 * Orders launcher tiles for one member: frequent and recent visits rise, the module's `defaultRank` breaks ties for
 * new members. Pure so it can be unit-tested and reused by any client surface.
 */
export type Visit = { moduleId: string; timestamp: number };
type Rankable = { key: string; defaultRank: number };

export function rankModules<T extends Rankable>(
  modules: readonly T[],
  frequency: Record<string, number>,
  recentVisits: readonly Visit[],
  limit = modules.length,
): T[] {
  return modules
    .map((module) => {
      const visits = frequency[module.key] ?? 0;
      const recentIndex = recentVisits.findIndex((visit) => visit.moduleId === module.key);
      const recency = recentIndex >= 0 ? Math.max(0, 10 - recentIndex) : 0;
      const starter = Math.max(0, 9 - module.defaultRank);
      return { module, score: visits * 3 + recency * 2 + starter };
    })
    .sort((a, b) => b.score - a.score || a.module.defaultRank - b.module.defaultRank)
    .slice(0, limit)
    .map((entry) => entry.module);
}

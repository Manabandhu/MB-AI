import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';
import { persistMeta } from '@/lib/queryPersistence';

export type ShellKind = 'home' | 'explore' | 'community' | 'chat' | 'profile';

/** Mirrors backend `CatalogScreenContent`: copy plus database-backed counts for a primary tab. */
export type ShellContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  metrics: { label: string; value: string }[];
  items: { id: string; title: string; body: string; meta: string; route: string }[];
};

export function getShellContent(kind: ShellKind): Promise<ShellContent> {
  return apiFetch(`/api/v1/foundation/screens/${kind}`).then((response) =>
    parseJsonOrThrow<ShellContent>(response, 'Screen content'),
  );
}

export const shellQueryKey = (kind: ShellKind) => ['foundation', 'shell', kind] as const;

export function useShellContent(kind: ShellKind) {
  return useQuery({
    queryKey: shellQueryKey(kind),
    queryFn: () => getShellContent(kind),
    staleTime: 60_000,
  });
}

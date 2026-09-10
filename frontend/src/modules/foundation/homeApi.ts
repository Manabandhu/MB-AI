import { apiFetch, parseJsonOrThrow } from '@/lib/apiClient';

export type HomeFeedItem = {
  id: string;
  kind: 'room' | 'ride' | 'post' | 'event' | 'job';
  title: string;
  body: string;
  meta: string;
  route: string;
};

export type HomeShellData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  greetingName: string;
  metrics: { label: string; value: string }[];
  feed: HomeFeedItem[];
};

type CatalogScreenPayload = Omit<HomeShellData, 'feed' | 'greetingName'> & {
  items: Omit<HomeFeedItem, 'kind'>[];
};

function feedKindFor(item: Omit<HomeFeedItem, 'kind'>): HomeFeedItem['kind'] {
  if (item.route.startsWith('/rooms') || item.id.includes('room')) return 'room';
  if (item.route.startsWith('/rides') || item.id.includes('ride')) return 'ride';
  if (item.route.startsWith('/jobs') || item.id.includes('job')) return 'job';
  if (item.route.startsWith('/events') || item.id.includes('event')) return 'event';
  return 'post';
}

function normalizeShellData(payload: CatalogScreenPayload): HomeShellData {
  return {
    ...payload,
    greetingName: 'friend',
    feed: payload.items.map((item) => ({ ...item, kind: feedKindFor(item) })),
  };
}

export async function getHomeShell(): Promise<HomeShellData> {
  return normalizeShellData(
    await parseJsonOrThrow<CatalogScreenPayload>(
      await apiFetch('/api/v1/foundation/screens/home'),
      'Home shell',
    ),
  );
}

export async function getProfileShell(): Promise<HomeShellData> {
  return normalizeShellData(
    await parseJsonOrThrow<CatalogScreenPayload>(
      await apiFetch('/api/v1/foundation/screens/profile'),
      'Profile shell',
    ),
  );
}

export async function getExploreShell(): Promise<HomeShellData> {
  return normalizeShellData(
    await parseJsonOrThrow<CatalogScreenPayload>(
      await apiFetch('/api/v1/foundation/screens/explore'),
      'Explore shell',
    ),
  );
}

export async function getChatShell(): Promise<HomeShellData> {
  return normalizeShellData(
    await parseJsonOrThrow<CatalogScreenPayload>(
      await apiFetch('/api/v1/foundation/screens/chat'),
      'Chat shell',
    ),
  );
}

export async function getCommunityShell(): Promise<HomeShellData> {
  return normalizeShellData(
    await parseJsonOrThrow<CatalogScreenPayload>(
      await apiFetch('/api/v1/foundation/screens/community'),
      'Community shell',
    ),
  );
}

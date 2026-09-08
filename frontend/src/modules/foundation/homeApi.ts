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

export async function getHomeShell(): Promise<HomeShellData> {
  return parseJsonOrThrow(await apiFetch('/api/v1/foundation/screens/home'), 'Home shell');
}

export async function getProfileShell(): Promise<HomeShellData> {
  return parseJsonOrThrow(await apiFetch('/api/v1/foundation/screens/profile'), 'Profile shell');
}

export async function getExploreShell(): Promise<HomeShellData> {
  return parseJsonOrThrow(await apiFetch('/api/v1/foundation/screens/explore'), 'Explore shell');
}

export async function getChatShell(): Promise<HomeShellData> {
  return parseJsonOrThrow(await apiFetch('/api/v1/foundation/screens/chat'), 'Chat shell');
}

export async function getCommunityShell(): Promise<HomeShellData> {
  return parseJsonOrThrow(
    await apiFetch('/api/v1/foundation/screens/community'),
    'Community shell',
  );
}

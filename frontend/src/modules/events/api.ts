import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';

export type Event = {
  id: string;
  organizerId?: string;
  categoryId?: string;
  title: string;
  description: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startAt?: string;
  endAt?: string;
  date?: string;
  organizer?: string;
  category?: string;
  image?: string;
  attendeeCount?: number;
  isSaved?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EventCategory = {
  id: string;
  name: string;
  count: number;
};

export type EventAttendee = {
  id: string;
  name: string;
  avatar?: string;
  status: string;
};

export async function listEvents(): Promise<Event[]> {
  const response = await apiFetch('/api/v1/events');
  const data = await parseJsonOrThrow<any>(response, 'Events');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function searchEvents(query: string): Promise<Event[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await apiFetch(`/api/v1/events/search${suffix}`);
  const data = await parseJsonOrThrow<any>(response, 'Events search');
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
}

export async function getEvent(id: string): Promise<Event> {
  const response = await apiFetch(`/api/v1/events/${encodeURIComponent(id)}`);
  return parseJsonOrThrow<Event>(response, 'Event detail');
}

export async function createEvent(input: {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  latitude?: number;
  longitude?: number;
  categoryId?: string;
}): Promise<Event> {
  const response = await apiFetch('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<Event>(response, 'Create event');
}

export async function listSavedEvents(): Promise<Event[]> {
  const response = await apiFetch('/api/v1/events/saved');
  const data = await parseJson<any>(response);
  if (Array.isArray(data)) return data;
  return [];
}

export async function listMyEvents(): Promise<Event[]> {
  const response = await apiFetch('/api/v1/events/mine');
  const data = await parseJson<any>(response);
  if (Array.isArray(data)) return data;
  return [];
}

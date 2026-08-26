import { apiFetch } from '@/lib/api';

export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  category: string;
  image?: string;
  attendeeCount: number;
  isSaved: boolean;
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

async function responseJson<T>(response: Response): Promise<T> {
  if (response.ok) return response.json() as Promise<T>;
  const detail = await response.text();
  throw new Error(detail || `Request failed: ${response.status}`);
}

export async function listEvents(): Promise<Event[]> {
  return responseJson(await apiFetch('/api/v1/events'));
}

export async function searchEvents(query: string): Promise<Event[]> {
  return responseJson(await apiFetch(`/api/v1/events/search?q=${encodeURIComponent(query)}`));
}

export async function getEvent(id: string): Promise<Event> {
  return responseJson(await apiFetch(`/api/v1/events/${encodeURIComponent(id)}`));
}

export async function createEvent(input: {
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
}): Promise<Event> {
  return responseJson(
    await apiFetch('/api/v1/events', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
}

export async function listSavedEvents(): Promise<Event[]> {
  return responseJson(await apiFetch('/api/v1/events/saved'));
}

export async function listMyEvents(): Promise<Event[]> {
  return responseJson(await apiFetch('/api/v1/events/mine'));
}

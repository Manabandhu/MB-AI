import { apiFetch, parseJson, parseJsonOrThrow } from '@/lib/apiClient';
import { type RawPage, toPage } from '@/lib/springPage';

export type Event = {
  id: string;
  /** True when the signed-in caller organizes the event; event reads are public, so organizer ids are never sent. */
  mine?: boolean | null;
  categoryId?: string;
  title: string;
  description?: string | null;
  location: string;
  latitude?: number;
  longitude?: number;
  startAt?: string;
  endAt?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Mirrors backend `EventCategory`. */
export type EventCategory = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
};

export async function listEvents(): Promise<Event[]> {
  const response = await apiFetch('/api/v1/events');
  return toPage(await parseJsonOrThrow<RawPage<Event>>(response, 'Events')).content;
}

export async function listEventCategories(): Promise<EventCategory[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/events/categories'), 'Event categories');
}

export async function searchEvents(query: string): Promise<Event[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await apiFetch(`/api/v1/events/search${suffix}`);
  return toPage(await parseJsonOrThrow<RawPage<Event>>(response, 'Events search')).content;
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
  categoryId: string;
}): Promise<Event> {
  const response = await apiFetch('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return parseJson<Event>(response);
}

/** Events the signed-in member has RSVPed to (going, interested, maybe) or saved. */
export async function listSavedEvents(): Promise<Event[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/events/saved'), 'Saved events');
}

export async function listMyEvents(): Promise<Event[]> {
  return parseJsonOrThrow(await apiFetch('/api/v1/events/mine'), 'My events');
}

/** RSVP statuses the backend accepts (stored lowercase). `saved` is a bookmark without attending. */
export type RsvpStatus = 'going' | 'interested' | 'maybe' | 'saved' | 'not_going';

/** Mirrors backend `EventAttendance`. */
export type EventAttendance = {
  id: string;
  eventId: string;
  userId: string;
  /** Lowercase; compare case-insensitively. */
  status: string;
  createdAt: string;
};

/** Organizers and admins get every RSVP; other members get only their own row (or none). */
export async function listEventAttendance(eventId: string): Promise<EventAttendance[]> {
  return parseJsonOrThrow(
    await apiFetch(`/api/v1/events/${encodeURIComponent(eventId)}/attendance`),
    'Event attendance',
  );
}

/** Sets (or changes) the caller's one RSVP; `not_going` cancels it. */
export async function rsvpEvent(eventId: string, status: RsvpStatus): Promise<EventAttendance> {
  return parseJson(
    await apiFetch(`/api/v1/events/${encodeURIComponent(eventId)}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  );
}

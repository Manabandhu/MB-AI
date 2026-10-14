import { apiFetch } from '@/lib/api';

// Google web-service calls go through the backend (/api/v1/rides/maps/*) so the key stays server-side. The proxy
// answers 503 when no key is configured and 429 when the caller has used up the per-minute budget.

/** Shown when the maps proxy rate-limits the caller. */
export const MAPS_RATE_LIMIT_MESSAGE =
  'Too many map lookups right now. Wait a minute and try again, or type the place name.';

/** A route as the Directions service reported it. Never an estimate. */
export interface RouteInfo {
  polyline: string;
  distanceMiles: number;
  durationMinutes: number;
  hasTolls: boolean;
  warnings?: string[];
  summary?: string;
}

/** Either a real route, or why there is none (`message` is safe to show). */
export type RouteResult =
  | { route: RouteInfo; message?: undefined }
  | { route: null; message: string };

export interface AutocompletePrediction {
  description: string;
  placeId: string;
  mainText?: string;
  secondaryText?: string;
}

export class MapsRateLimitError extends Error {
  readonly status = 429;
  constructor() {
    super(MAPS_RATE_LIMIT_MESSAGE);
    this.name = 'MapsRateLimitError';
  }
}

/**
 * Route distance, duration and tolls from the Directions proxy. When the lookup fails, nothing is guessed: the
 * result has no route and a message saying the details are unavailable, and the ride is posted without them.
 */
export async function fetchGoogleRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  avoidTolls = false,
): Promise<RouteResult> {
  const query = new URLSearchParams({
    originLat: String(origin.lat),
    originLng: String(origin.lng),
    destinationLat: String(destination.lat),
    destinationLng: String(destination.lng),
    avoidTolls: String(avoidTolls),
  });
  try {
    const res = await apiFetch(`/api/v1/rides/maps/route?${query.toString()}`);
    if (res.status === 429) return { route: null, message: MAPS_RATE_LIMIT_MESSAGE };
    if (!res.ok) {
      return { route: null, message: 'Route distance and time are unavailable right now.' };
    }
    const route = (await res.json()) as RouteInfo;
    if (!Number.isFinite(route.distanceMiles) || !Number.isFinite(route.durationMinutes)) {
      return { route: null, message: 'Route distance and time are unavailable for these places.' };
    }
    return { route };
  } catch {
    return { route: null, message: 'Route distance and time are unavailable right now.' };
  }
}

/**
 * Place suggestions from the Places proxy. When the proxy is not configured or unreachable this falls back to
 * OpenStreetMap Photon (suggestions only, the person still chooses). A 429 throws `MapsRateLimitError`.
 */
export async function autocompletePlacesGoogle(query: string): Promise<AutocompletePrediction[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const res = await apiFetch(`/api/v1/rides/maps/autocomplete?q=${encodeURIComponent(query)}`);
    if (res.status === 429) throw new MapsRateLimitError();
    if (res.ok) {
      const predictions = (await res.json()) as AutocompletePrediction[];
      if (predictions.length > 0) return predictions;
    }
  } catch (error) {
    if (error instanceof MapsRateLimitError) throw error;
    // fall through to Photon
  }

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&bbox=-125,24,-66,49`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    interface PhotonProp {
      name?: string;
      housenumber?: string;
      street?: string;
      city?: string;
      district?: string;
      state?: string;
      postcode?: string;
    }
    interface PhotonItem {
      properties: PhotonProp;
      geometry?: { coordinates: [number, number] };
    }
    return (data.features || [])
      .filter((f: PhotonItem) => f.geometry?.coordinates?.length === 2)
      .map((f: PhotonItem) => {
        const p = f.properties;
        const main =
          p.name || [p.housenumber, p.street].filter(Boolean).join(' ') || p.city || query;
        const secondary = [p.city || p.district, p.state, p.postcode].filter(Boolean).join(', ');
        const coords = f.geometry?.coordinates as [number, number];
        return {
          description: [main, secondary].filter(Boolean).join(', '),
          placeId: `${coords[1]},${coords[0]}`,
          mainText: main,
          secondaryText: secondary,
        };
      });
  } catch {
    return [];
  }
}

/** Coordinates for a chosen place; null when it cannot be found. A 429 throws `MapsRateLimitError`. */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null;

  // Photon suggestions carry their coordinates as "lat,lng".
  const latLngMatch = address.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  if (latLngMatch) {
    return { lat: parseFloat(latLngMatch[1]), lng: parseFloat(latLngMatch[3]) };
  }

  try {
    const res = await apiFetch(`/api/v1/rides/maps/geocode?address=${encodeURIComponent(address)}`);
    if (res.status === 429) throw new MapsRateLimitError();
    if (res.ok) return (await res.json()) as { lat: number; lng: number };
  } catch (error) {
    if (error instanceof MapsRateLimitError) throw error;
    // fall back to Photon below
  }

  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&bbox=-125,24,-66,49`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (coords && coords.length >= 2) return { lat: coords[1], lng: coords[0] };
  } catch {
    return null;
  }
  return null;
}

import { apiFetch } from '@/lib/api';

// Google web-service calls go through the backend (/api/v1/rides/maps/*) so the key stays server-side.
// When the backend has no key configured it answers 503 and these helpers fall back to free estimators.

export interface RouteInfo {
  polyline: string;
  distanceMiles: number;
  durationMinutes: number;
  hasTolls: boolean;
  warnings?: string[];
  summary?: string;
}

export interface AutocompletePrediction {
  description: string;
  placeId: string;
  mainText?: string;
  secondaryText?: string;
}

/**
 * Fetch route information via the backend Directions proxy, or fall back to a calculated estimate.
 */
export async function fetchGoogleRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  avoidTolls: boolean = false,
): Promise<RouteInfo | null> {
  try {
    const query = new URLSearchParams({
      originLat: String(origin.lat),
      originLng: String(origin.lng),
      destinationLat: String(destination.lat),
      destinationLng: String(destination.lng),
      avoidTolls: String(avoidTolls),
    });
    const res = await apiFetch(`/api/v1/rides/maps/route?${query.toString()}`);
    if (res.ok) return (await res.json()) as RouteInfo;
  } catch (error) {
    console.warn('Route lookup failed, falling back to estimation:', error);
  }

  // Graceful fallback: Calculate great-circle haversine distance & driving duration estimate
  const R = 3958.8; // Earth radius in miles
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directMiles = R * c;
  const roadMiles = parseFloat((directMiles * 1.25).toFixed(1)); // 1.25 winding road multiplier
  const durationMinutes = Math.max(5, Math.round((roadMiles / 45) * 60)); // assuming 45mph average

  return {
    polyline: '',
    distanceMiles: roadMiles,
    durationMinutes,
    hasTolls: !avoidTolls && roadMiles > 15, // estimated toll likelihood on longer commutes
    summary: avoidTolls ? 'Non-Toll Surface Route' : 'Highway Route',
  };
}

/**
 * Places autocomplete via the backend Places proxy, with fallback to OpenStreetMap Photon.
 */
export async function autocompletePlacesGoogle(query: string): Promise<AutocompletePrediction[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const res = await apiFetch(`/api/v1/rides/maps/autocomplete?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const predictions = (await res.json()) as AutocompletePrediction[];
      if (predictions.length > 0) return predictions;
    }
  } catch (e) {
    console.warn('Places autocomplete failed, falling back to Photon:', e);
  }

  // Graceful free fallback: OpenStreetMap Photon
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
    return (data.features || []).map((f: PhotonItem) => {
      const p = f.properties;
      const main = p.name || [p.housenumber, p.street].filter(Boolean).join(' ') || p.city || query;
      const secondary = [p.city || p.district, p.state, p.postcode].filter(Boolean).join(', ');
      const desc = [main, secondary].filter(Boolean).join(', ');
      return {
        description: desc,
        placeId: `${f.geometry?.coordinates?.[1] || 0},${f.geometry?.coordinates?.[0] || 0}`,
        mainText: main,
        secondaryText: secondary,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Geocode address to lat/lng coordinates.
 */
export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null;

  // Check if address is already lat,lng
  const latLngMatch = address.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
  if (latLngMatch) {
    return { lat: parseFloat(latLngMatch[1]), lng: parseFloat(latLngMatch[3]) };
  }

  try {
    const res = await apiFetch(`/api/v1/rides/maps/geocode?address=${encodeURIComponent(address)}`);
    if (res.ok) return (await res.json()) as { lat: number; lng: number };
  } catch {
    // fall back to Photon below
  }

  // Free Photon geocode
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&bbox=-125,24,-66,49`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (coords && coords.length >= 2) {
      return { lat: coords[1], lng: coords[0] };
    }
  } catch {
    return null;
  }

  return null;
}

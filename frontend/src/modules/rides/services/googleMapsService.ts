const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
 * Fetch route information from Google Directions API or fallback to calculated estimate.
 */
export async function fetchGoogleRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  avoidTolls: boolean = false,
): Promise<RouteInfo | null> {
  const avoidParam = avoidTolls ? '&avoid=tolls' : '';

  if (GOOGLE_MAPS_API_KEY) {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving${avoidParam}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.routes?.[0]) {
        const route = data.routes[0];
        const leg = route.legs[0];

        // Check if route steps contain toll road warnings
        const warnings: string[] = route.warnings || [];
        const summary: string = route.summary || '';
        const hasTolls =
          warnings.some((w: string) => w.toLowerCase().includes('toll')) ||
          summary.toLowerCase().includes('toll');

        return {
          polyline: route.overview_polyline?.points || '',
          distanceMiles: parseFloat((leg.distance.value * 0.000621371).toFixed(1)),
          durationMinutes: Math.round(leg.duration.value / 60),
          hasTolls,
          warnings,
          summary,
        };
      }
    } catch (error) {
      console.warn('Google Directions API call failed, falling back to estimation:', error);
    }
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
 * Places autocomplete search via Google Places API with fallback to OpenStreetMap Photon.
 */
export async function autocompletePlacesGoogle(query: string): Promise<AutocompletePrediction[]> {
  if (!query || query.trim().length < 3) return [];

  if (GOOGLE_MAPS_API_KEY) {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:us&types=geocode|establishment&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.predictions)) {
        interface GooglePrediction {
          description: string;
          place_id: string;
          structured_formatting?: {
            main_text?: string;
            secondary_text?: string;
          };
        }
        return (data.predictions as GooglePrediction[]).map((p) => ({
          description: p.description,
          placeId: p.place_id,
          mainText: p.structured_formatting?.main_text,
          secondaryText: p.structured_formatting?.secondary_text,
        }));
      }
    } catch (e) {
      console.warn('Google Places autocomplete failed, falling back to Photon:', e);
    }
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

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const loc = data.results?.[0]?.geometry?.location;
      if (loc) {
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch {
      // fallback to photon below
    }
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

import { City, State } from 'country-state-city';

export type USState = {
  code: string;
  name: string;
};

export type USCity = {
  name: string;
};

export type FreeAddressSuggestion = {
  formattedAddress: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
};

export type ZipLookupResult = {
  city: string;
  state: string;
  lat: number;
  lng: number;
};

// 1. Free Country/State/City lookup (100% offline, zero API key)
export function getUSStates(): USState[] {
  const raw = State.getStatesOfCountry('US') || [];
  return raw.map((s) => ({
    code: s.isoCode,
    name: s.name,
  }));
}

export function getCitiesByState(stateCode: string): USCity[] {
  if (!stateCode) return [];
  const raw = City.getCitiesOfState('US', stateCode.toUpperCase()) || [];
  return raw.map((c) => ({
    name: c.name,
  }));
}

interface PhotonFeature {
  properties: {
    housenumber?: string;
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    postcode?: string;
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

// 2. Free Street Address Autocomplete & Lat/Lng via OpenStreetMap Photon API
export async function searchAddressFree(query: string): Promise<FreeAddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&bbox=-125,24,-66,49`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f: PhotonFeature) => ({
      formattedAddress: [
        f.properties.housenumber,
        f.properties.street,
        f.properties.city,
        f.properties.state,
        f.properties.postcode,
      ]
        .filter(Boolean)
        .join(', '),
      city: f.properties.city || f.properties.district || '',
      state: f.properties.state || '',
      zip: f.properties.postcode || '',
      lat: f.geometry?.coordinates?.[1] ?? 0,
      lng: f.geometry?.coordinates?.[0] ?? 0,
    }));
  } catch (e) {
    console.warn('Photon geocoding fallback error:', e);
    return [];
  }
}

// 3. Free Zip Code Quick-Fill via Zippopotam
export async function lookupZipCodeFree(zip: string): Promise<ZipLookupResult | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places?.[0];
    return place
      ? {
          city: place['place name'],
          state: place['state abbreviation'],
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
        }
      : null;
  } catch {
    return null;
  }
}

export type SearchCityResult = {
  id: string;
  name: string;
  cityName: string;
  stateCode: string;
  latitude: number;
  longitude: number;
};

let cachedUSCities: SearchCityResult[] | null = null;

function getCachedUSCities(): SearchCityResult[] {
  if (!cachedUSCities) {
    const raw = City.getCitiesOfCountry('US') || [];
    cachedUSCities = raw.map((c) => ({
      id: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${c.stateCode.toLowerCase()}`,
      name: `${c.name}, ${c.stateCode}`,
      cityName: c.name,
      stateCode: c.stateCode,
      latitude: c.latitude ? Number(c.latitude) || 0 : 0,
      longitude: c.longitude ? Number(c.longitude) || 0 : 0,
    }));
  }
  return cachedUSCities;
}

export function searchAllUSCities(query: string, maxResults = 35): SearchCityResult[] {
  const cities = getCachedUSCities();
  const raw = query.trim().toLowerCase();
  if (!raw) return [];

  let cityNameQuery = raw;
  let stateQuery = '';
  if (raw.includes(',')) {
    const parts = raw.split(',');
    cityNameQuery = parts[0].trim();
    stateQuery = parts[1].trim();
  }

  // Normalize repeated characters for typo tolerance (e.g. "coppel" -> "copel" matching "coppell")
  const normCityQuery = cityNameQuery.replace(/(.)\1+/g, '$1');

  const exactStarts: SearchCityResult[] = [];
  const exactContains: SearchCityResult[] = [];
  const fuzzy: SearchCityResult[] = [];

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    const nameLower = c.cityName.toLowerCase();
    const stateLower = c.stateCode.toLowerCase();

    // If state was specified (e.g. "jonesboro, ar" or "coppel, tx"), verify state matches
    if (stateQuery && !stateLower.startsWith(stateQuery) && !stateLower.includes(stateQuery)) {
      continue;
    }

    if (nameLower.startsWith(cityNameQuery)) {
      exactStarts.push(c);
    } else if (nameLower.includes(cityNameQuery)) {
      exactContains.push(c);
    } else if (normCityQuery.length >= 3) {
      const normName = nameLower.replace(/(.)\1+/g, '$1');
      if (normName.startsWith(normCityQuery) || normName.includes(normCityQuery)) {
        fuzzy.push(c);
      }
    }
    if (exactStarts.length >= maxResults) break;
  }

  return [...exactStarts, ...exactContains, ...fuzzy].slice(0, maxResults);
}

export const ALL_USA_CITY: SearchCityResult = {
  id: 'all-usa',
  name: 'All Cities (USA)',
  cityName: 'All Cities',
  stateCode: 'USA',
  latitude: 39.8283,
  longitude: -98.5795,
};

/**
 * Calculates straight-line distance in miles between two coordinate points
 */
export function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 0.017453292519943295;
  const dLon = (lon2 - lon1) * 0.017453292519943295;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * 0.017453292519943295) *
      Math.cos(lat2 * 0.017453292519943295) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Finds the closest indexed US city to any GPS or IP coordinates
 */
export function getClosestUSCity(latitude: number, longitude: number): SearchCityResult | null {
  const cities = getCachedUSCities();
  let closest: SearchCityResult | null = null;
  let minDist = Number.POSITIVE_INFINITY;

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    if (c.latitude === 0 && c.longitude === 0) continue;
    // Bounding box filter for speed
    if (Math.abs(c.latitude - latitude) > 1.5 || Math.abs(c.longitude - longitude) > 1.5) {
      continue;
    }
    const dist = getDistanceMiles(latitude, longitude, c.latitude, c.longitude);
    if (dist < minDist) {
      minDist = dist;
      closest = c;
    }
  }

  return closest;
}

export type NearbyCityResult = SearchCityResult & {
  distanceMiles: number;
};

/**
 * Finds 4 to 5 nearby cities within driving distance (~1 to 35 miles), sorted by distance
 */
export function getNearbyUSCities(
  latitude: number,
  longitude: number,
  count = 5,
): NearbyCityResult[] {
  const cities = getCachedUSCities();
  const results: NearbyCityResult[] = [];

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    if (c.latitude === 0 && c.longitude === 0) continue;
    const lowerName = c.cityName.toLowerCase();
    // Exclude county/township labels
    if (
      lowerName.includes('county') ||
      lowerName.includes('township') ||
      lowerName.includes('district')
    ) {
      continue;
    }
    // Fast bounding box check (+- 0.8 degrees approx 55 miles)
    if (Math.abs(c.latitude - latitude) > 0.8 || Math.abs(c.longitude - longitude) > 0.8) {
      continue;
    }

    const dist = getDistanceMiles(latitude, longitude, c.latitude, c.longitude);
    // Exclude the city itself (dist >= 1.0 mi) and limit to local travel (<= 35 mi)
    if (dist >= 1.0 && dist <= 35.0) {
      results.push({
        ...c,
        distanceMiles: Math.round(dist * 10) / 10,
      });
    }
  }

  results.sort((a, b) => a.distanceMiles - b.distanceMiles);
  return results.slice(0, count);
}

/**
 * Detects current device location via browser Geolocation API or fast IP lookup
 */
export async function detectCurrentLocation(): Promise<SearchCityResult | null> {
  // 1. Try browser / mobile navigator geolocation
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 120000,
        });
      });
      const city = getClosestUSCity(pos.coords.latitude, pos.coords.longitude);
      if (city) {
        return city;
      }
    } catch {
      // Geolocation denied or timed out, proceed to IP fallback
    }
  }

  // 2. Fallback to free IP geolocation
  try {
    const res = await fetch('https://freeipapi.com/api/json', {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const city = getClosestUSCity(Number(data.latitude), Number(data.longitude));
        if (city) {
          return city;
        }
      }
    }
  } catch {
    // Network offline or failed
  }

  return null;
}

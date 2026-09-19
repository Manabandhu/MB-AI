import { US_CITIES, US_STATES } from './usLocationData';

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
  return US_STATES;
}

export function getCitiesByState(stateCode: string): USCity[] {
  if (!stateCode) return [];
  const upper = stateCode.toUpperCase();
  return US_CITIES.filter((c) => c.state === upper).map((c) => ({
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

export function searchAllUSCities(query: string, maxResults = 30): SearchCityResult[] {
  if (!cachedUSCities) {
    cachedUSCities = US_CITIES.map((c) => ({
      id: `${c.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${c.state.toLowerCase()}`,
      name: `${c.name}, ${c.state}`,
      cityName: c.name,
      stateCode: c.state,
      latitude: c.lat,
      longitude: c.lng,
    }));
  }

  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const starts: SearchCityResult[] = [];
  const contains: SearchCityResult[] = [];

  for (const c of cachedUSCities) {
    const lowerName = c.cityName.toLowerCase();
    const lowerFull = c.name.toLowerCase();
    if (lowerName.startsWith(clean)) {
      starts.push(c);
    } else if (lowerFull.includes(clean)) {
      contains.push(c);
    }
    if (starts.length >= maxResults) break;
  }

  return [...starts, ...contains].slice(0, maxResults);
}

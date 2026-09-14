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
  return State.getStatesOfCountry('US').map((s) => ({
    code: s.isoCode,
    name: s.name,
  }));
}

export function getCitiesByState(stateCode: string): USCity[] {
  if (!stateCode) return [];
  return City.getCitiesOfState('US', stateCode).map((c) => ({
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

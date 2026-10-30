// Pure room-discovery rules (city matching, filters, sort). No React or app aliases, so `frontend/test` can import it.
import { type Coordinate, distanceMiles, isPointInPolygon } from '../../shared/utils/geoPolygon';
import type { RoomListing } from '../types';

export type RoomSort = 'recommended' | 'price_low' | 'price_high' | 'newest';

export const SORT_OPTIONS: readonly { id: RoomSort; label: string }[] = [
  { id: 'recommended', label: 'Best match for your city' },
  { id: 'price_low', label: 'Price: low to high' },
  { id: 'price_high', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest first' },
];

export type DietFilter = 'pure_veg' | 'veg_friendly' | 'non_veg_ok';

/** Each diet choice and the stored `dietaryPreference` values it accepts. */
const DIET_MATCHES: Record<DietFilter, readonly string[]> = {
  pure_veg: ['PURE_VEG'],
  veg_friendly: ['PURE_VEG', 'VEG_PREFERRED', 'VEG_FRIENDLY'],
  non_veg_ok: ['NON_VEG_ALLOWED', 'ANY'],
};

export const DIET_FILTERS: readonly { id: DietFilter; label: string }[] = [
  { id: 'pure_veg', label: 'Pure veg' },
  { id: 'veg_friendly', label: 'Veg friendly' },
  { id: 'non_veg_ok', label: 'Non-veg OK' },
];

export type GenderFilter = 'FEMALE_ONLY' | 'MALE_ONLY';

export const GENDER_FILTERS: readonly { id: GenderFilter; label: string }[] = [
  { id: 'FEMALE_ONLY', label: 'Female only' },
  { id: 'MALE_ONLY', label: 'Male only' },
];

/** Max-rent steps shared by the quick chip and the filter sheet, so both always show the same choice. */
export const PRICE_STEPS = [600, 800, 1000, 1200, 1500] as const;
export const QUICK_MAX_PRICE = 800;
/** Amenity code behind the "Furnished" quick chip (catalog codes are compared case-insensitively). */
export const FURNISHED_AMENITY = 'furnished_bed';

export type RoomFilters = {
  query: string;
  /** One of `ROOM_TYPES`, compared case-insensitively. */
  roomType: string | null;
  maxPrice: number | null;
  diet: DietFilter | null;
  gender: GenderFilter | null;
  privateBath: boolean;
  /** Lowercase amenity codes; a room must have every one. */
  amenities: string[];
  /** Hand-drawn map area (3+ points). Rooms without coordinates never match it. */
  area: Coordinate[] | null;
  sort: RoomSort;
};

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
  query: '',
  roomType: null,
  maxPrice: null,
  diet: null,
  gender: null,
  privateBath: false,
  amenities: [],
  area: null,
  sort: 'recommended',
};

const upper = (value?: string | null) => (value ?? '').toUpperCase().trim();

export function hasArea(area: Coordinate[] | null | undefined): area is Coordinate[] {
  return Array.isArray(area) && area.length >= 3;
}

/**
 * Filters narrowing the list, excluding the search text and sort: room type, max rent, diet, gender, private bath,
 * each amenity, and a drawn area. The quick chips write into the same fields, so they are counted here too.
 */
export function activeFilterCount(filters: RoomFilters): number {
  return (
    (filters.roomType ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.diet ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.privateBath ? 1 : 0) +
    filters.amenities.length +
    (hasArea(filters.area) ? 1 : 0)
  );
}

/** True when anything differs from the defaults: a filter, the search text, or a non-default sort. */
export function hasActiveFilters(filters: RoomFilters): boolean {
  return (
    activeFilterCount(filters) > 0 ||
    filters.query.trim().length > 0 ||
    filters.sort !== DEFAULT_ROOM_FILTERS.sort
  );
}

/** Adds or removes an amenity code (stored lowercase). */
export function toggleAmenity(amenities: readonly string[], code: string): string[] {
  const key = code.toLowerCase();
  return amenities.includes(key) ? amenities.filter((a) => a !== key) : [...amenities, key];
}

/** Real coordinates only. Rooms without them are left off the map and out of drawn-area searches. */
export function roomCoordinate(
  room: Pick<RoomListing, 'latitude' | 'longitude'>,
): Coordinate | null {
  const latitude = room.latitude == null ? Number.NaN : Number(room.latitude);
  const longitude = room.longitude == null ? Number.NaN : Number(room.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { latitude, longitude };
}

export function isPrivateBath(room: Pick<RoomListing, 'bathroomType'>): boolean {
  const bath = upper(room.bathroomType);
  return bath === 'PRIVATE_ATTACHED' || bath === 'PRIVATE_DEDICATED';
}

export function isPureVeg(room: Pick<RoomListing, 'dietaryPreference'>): boolean {
  return upper(room.dietaryPreference) === 'PURE_VEG';
}

export function isFurnished(room: Pick<RoomListing, 'amenities'>): boolean {
  return (room.amenities ?? []).some((a) => a.toLowerCase() === FURNISHED_AMENITY);
}

/** The selected city (`locationStore.currentLocation`). */
export type CityFilter = {
  id: string;
  name: string;
  cityName?: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
};

export const ALL_CITIES_ID = 'all-usa';

export function isAllCities(city: CityFilter): boolean {
  return (
    !city.name ||
    city.id === ALL_CITIES_ID ||
    city.id === 'all' ||
    city.name.toLowerCase().includes('all cities')
  );
}

/** Rooms with coordinates farther than this from the chosen city are left out (great-circle distance). */
const CITY_RADIUS_MILES = 14;

function cityParts(city: CityFilter) {
  const cityName = (city.cityName || city.name.split(',')[0] || '').toLowerCase().trim();
  const state = upper(city.stateCode || city.name.split(',')[1]);
  return { cityName, state };
}

/**
 * Whether a listing belongs to the chosen city: same state (NY and NJ count as one metro), then the city name in the
 * area or title, then coordinates within 14 miles; listings without coordinates fall back to the city's words.
 */
export function matchesRoomLocation(
  room: Pick<RoomListing, 'title' | 'broadLocation' | 'stateCode' | 'latitude' | 'longitude'>,
  city: CityFilter,
): boolean {
  if (isAllCities(city)) return true;
  const { cityName, state } = cityParts(city);
  const area = (room.broadLocation ?? '').toLowerCase();
  const title = (room.title ?? '').toLowerCase();
  const roomState = upper(room.stateCode);

  // Only two-letter codes are compared: some older rows store the full state name.
  if (state.length === 2 && roomState.length === 2 && state !== 'US') {
    const metro = ['NY', 'NJ'];
    const sameMetro = metro.includes(state) && metro.includes(roomState);
    if (!sameMetro && roomState !== state) return false;
  }

  if (cityName.length > 2 && (area.includes(cityName) || title.includes(cityName))) return true;

  const point = roomCoordinate(room);
  if (point && city.latitude != null && city.longitude != null) {
    return (
      distanceMiles({ latitude: city.latitude, longitude: city.longitude }, point) <=
      CITY_RADIUS_MILES
    );
  }

  const tokens = cityName
    .split(/[\s\-/,+]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && t !== 'area' && t !== 'metro');
  return tokens.some((t) => area.includes(t) || title.includes(t));
}

/** True when the listing passes every filter (search text, quick chips, sheet filters, drawn area). */
export function matchesRoomFilters(room: RoomListing, filters: RoomFilters): boolean {
  if (hasArea(filters.area)) {
    const point = roomCoordinate(room);
    if (!point || !isPointInPolygon(point, filters.area)) return false;
  }
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const haystack = [room.title, room.broadLocation ?? '', room.roomType].join(' ').toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.roomType && upper(room.roomType) !== upper(filters.roomType)) return false;
  if (filters.maxPrice != null && Number(room.price) > filters.maxPrice) return false;
  if (filters.diet && !DIET_MATCHES[filters.diet].includes(upper(room.dietaryPreference))) {
    return false;
  }
  if (filters.gender && upper(room.genderPreference) !== filters.gender) return false;
  if (filters.privateBath && !isPrivateBath(room)) return false;
  if (filters.amenities.length > 0) {
    const have = (room.amenities ?? []).map((a) => a.toLowerCase());
    if (!filters.amenities.every((code) => have.includes(code))) return false;
  }
  return true;
}

/** Sorts a copy. "Best match" keeps server order but lists rooms naming the chosen city first. */
export function sortRooms<T extends RoomListing>(
  rooms: readonly T[],
  sort: RoomSort,
  city?: CityFilter,
): T[] {
  const copy = [...rooms];
  if (sort === 'price_low') return copy.sort((a, b) => a.price - b.price);
  if (sort === 'price_high') return copy.sort((a, b) => b.price - a.price);
  if (sort === 'newest') {
    return copy.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
  if (!city || isAllCities(city)) return copy;
  const { cityName } = cityParts(city);
  if (!cityName) return copy;
  const named = (r: T) =>
    (r.broadLocation ?? '').toLowerCase().includes(cityName) ||
    r.title.toLowerCase().includes(cityName)
      ? 1
      : 0;
  return copy.sort((a, b) => named(b) - named(a));
}

/** Listings in the chosen city, then filtered and sorted. */
export function selectRooms<T extends RoomListing>(
  rooms: readonly T[],
  city: CityFilter,
  filters: RoomFilters,
): { cityRooms: T[]; results: T[] } {
  const cityRooms = rooms.filter((room) => matchesRoomLocation(room, city));
  const results = sortRooms(
    cityRooms.filter((room) => matchesRoomFilters(room, filters)),
    filters.sort,
    city,
  );
  return { cityRooms, results };
}

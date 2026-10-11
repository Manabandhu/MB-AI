import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

// App code imports siblings without an extension (Metro resolves them); teach Node to try `.ts` for those.
register(
  `data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, next) {
      try { return await next(specifier, context); }
      catch (error) {
        if (specifier.startsWith('.') && !/\\.[cm]?[jt]sx?$/.test(specifier)) return next(specifier + '.ts', context);
        throw error;
      }
    }`)}`,
  import.meta.url,
);

const {
  activeFilterCount,
  DEFAULT_ROOM_FILTERS,
  FURNISHED_AMENITY,
  hasActiveFilters,
  matchesRoomFilters,
  matchesRoomLocation,
  PRICE_STEPS,
  QUICK_MAX_PRICE,
  roomCoordinate,
  selectRooms,
  sortRooms,
  toggleAmenity,
} = await import('../src/modules/rooms/utils/roomFilters.ts');

const room = (overrides = {}) => ({
  id: 'r1',
  title: 'Sunny room',
  price: 900,
  roomType: 'Private Room',
  status: 'active',
  broadLocation: 'Frisco, TX',
  stateCode: 'TX',
  latitude: 33.15,
  longitude: -96.82,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  amenities: [],
  preferences: [],
  savedByViewer: false,
  isOwner: false,
  ...overrides,
});

const filters = (overrides = {}) => ({ ...DEFAULT_ROOM_FILTERS, ...overrides });

const frisco = {
  id: 'frisco-tx',
  name: 'Frisco, TX',
  cityName: 'Frisco',
  stateCode: 'TX',
  latitude: 33.15,
  longitude: -96.82,
};
const allCities = { id: 'all-usa', name: 'All Cities (USA)', latitude: 39.8, longitude: -98.6 };

test('defaults count as no filters', () => {
  assert.equal(activeFilterCount(DEFAULT_ROOM_FILTERS), 0);
  assert.equal(hasActiveFilters(DEFAULT_ROOM_FILTERS), false);
});

test('every filter, including amenities and a drawn area, is counted', () => {
  const area = [
    { latitude: 1, longitude: 1 },
    { latitude: 1, longitude: 2 },
    { latitude: 2, longitude: 2 },
  ];
  const all = filters({
    roomType: 'Shared 2B2B',
    maxPrice: 800,
    diet: 'pure_veg',
    gender: 'FEMALE_ONLY',
    privateBath: true,
    amenities: ['wifi', FURNISHED_AMENITY],
    area,
  });
  assert.equal(activeFilterCount(all), 8);
  // Search text and sort are not counted, but search still makes the list "filtered".
  assert.equal(activeFilterCount(filters({ query: 'x', sort: 'newest' })), 0);
  assert.equal(hasActiveFilters(filters({ query: ' x ' })), true);
  assert.equal(hasActiveFilters(filters({ query: '   ' })), false);
  // A non-default sort is something "Clear filters" can reset.
  assert.equal(hasActiveFilters(filters({ sort: 'price_low' })), true);
});

test('the quick price chip uses one of the sheet steps', () => {
  assert.ok(PRICE_STEPS.includes(QUICK_MAX_PRICE));
});

test('amenity toggles are case-insensitive', () => {
  assert.deepEqual(toggleAmenity([], 'FURNISHED_BED'), ['furnished_bed']);
  assert.deepEqual(toggleAmenity(['furnished_bed'], 'Furnished_Bed'), []);
});

test('filters use real listing fields', () => {
  assert.equal(matchesRoomFilters(room(), filters({ maxPrice: 800 })), false);
  assert.equal(matchesRoomFilters(room({ price: 800 }), filters({ maxPrice: 800 })), true);
  assert.equal(
    matchesRoomFilters(
      room({ roomType: 'entire house / sublease' }),
      filters({ roomType: 'Entire House / Sublease' }),
    ),
    true,
  );
  assert.equal(
    matchesRoomFilters(
      room({ dietaryPreference: 'veg_preferred' }),
      filters({ diet: 'veg_friendly' }),
    ),
    true,
  );
  assert.equal(
    matchesRoomFilters(room({ dietaryPreference: 'VEG_PREFERRED' }), filters({ diet: 'pure_veg' })),
    false,
  );
  assert.equal(
    matchesRoomFilters(
      room({ genderPreference: 'female_only' }),
      filters({ gender: 'FEMALE_ONLY' }),
    ),
    true,
  );
  assert.equal(
    matchesRoomFilters(room({ bathroomType: 'PRIVATE_DEDICATED' }), filters({ privateBath: true })),
    true,
  );
  assert.equal(
    matchesRoomFilters(room({ bathroomType: 'SHARED' }), filters({ privateBath: true })),
    false,
  );
  assert.equal(
    matchesRoomFilters(
      room({ amenities: ['FURNISHED_BED', 'WIFI'] }),
      filters({ amenities: ['furnished_bed'] }),
    ),
    true,
  );
  assert.equal(
    matchesRoomFilters(room({ amenities: ['WIFI'] }), filters({ amenities: ['furnished_bed'] })),
    false,
  );
  assert.equal(matchesRoomFilters(room(), filters({ query: 'frisco' })), true);
  assert.equal(matchesRoomFilters(room(), filters({ query: 'austin' })), false);
});

test('a drawn area never matches rooms without coordinates', () => {
  const area = [
    { latitude: 33, longitude: -97 },
    { latitude: 33.3, longitude: -97 },
    { latitude: 33.3, longitude: -96.6 },
    { latitude: 33, longitude: -96.6 },
  ];
  assert.equal(matchesRoomFilters(room(), filters({ area })), true);
  assert.equal(
    matchesRoomFilters(room({ latitude: null, longitude: null }), filters({ area })),
    false,
  );
  assert.equal(roomCoordinate(room({ latitude: 0, longitude: 0 })), null);
});

test('city matching keeps distant cities in the same state out', () => {
  const austin = room({ broadLocation: 'North Austin, TX', latitude: 30.4, longitude: -97.7 });
  assert.equal(matchesRoomLocation(austin, frisco), false);
  assert.equal(matchesRoomLocation(room(), frisco), true);
  assert.equal(matchesRoomLocation(room({ stateCode: 'OK' }), frisco), false);
  assert.equal(matchesRoomLocation(austin, allCities), true);
  // Rooms without coordinates fall back to the city name.
  assert.equal(
    matchesRoomLocation(room({ latitude: null, longitude: null, broadLocation: 'Frisco' }), frisco),
    true,
  );
});

test('sort orders by price and date without mutating the input', () => {
  const rooms = [
    room({ id: 'a', price: 900, createdAt: '2026-01-01T00:00:00Z' }),
    room({ id: 'b', price: 600, createdAt: '2026-03-01T00:00:00Z' }),
  ];
  assert.deepEqual(
    sortRooms(rooms, 'price_low').map((r) => r.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    sortRooms(rooms, 'price_high').map((r) => r.id),
    ['a', 'b'],
  );
  assert.deepEqual(
    sortRooms(rooms, 'newest').map((r) => r.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    rooms.map((r) => r.id),
    ['a', 'b'],
  );
});

test('selectRooms separates the city list from the filtered result', () => {
  const rooms = [room({ id: 'a' }), room({ id: 'b', price: 1400 })];
  const { cityRooms, results } = selectRooms(rooms, frisco, filters({ maxPrice: 1000 }));
  assert.equal(cityRooms.length, 2);
  assert.deepEqual(
    results.map((r) => r.id),
    ['a'],
  );
});

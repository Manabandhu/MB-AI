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

const { ALL_USA_CITY, getCitiesByState, getNearbyUSCities, getUSStates, searchAllUSCities } =
  await import('../src/modules/shared/utils/location/locationService.ts');

test('lists US states with codes', () => {
  const states = getUSStates();
  assert.ok(states.length >= 50);
  assert.deepEqual(
    states.find((s) => s.code === 'TX'),
    { code: 'TX', name: 'Texas' },
  );
});

test('lists cities for a state case-insensitively', () => {
  const cities = getCitiesByState('tx').map((c) => c.name);
  assert.ok(cities.includes('Austin'));
  assert.deepEqual(getCitiesByState(''), []);
});

test('searches cities by name and optional state', () => {
  const austin = searchAllUSCities('austin, tx');
  assert.equal(austin[0].name, 'Austin, TX');
  assert.ok(austin[0].latitude > 30 && austin[0].latitude < 31);
  assert.deepEqual(searchAllUSCities('   '), []);
});

test('finds nearby cities sorted by distance', () => {
  const nearby = getNearbyUSCities(ALL_USA_CITY.latitude, ALL_USA_CITY.longitude);
  for (let i = 1; i < nearby.length; i++) {
    assert.ok(nearby[i - 1].distanceMiles <= nearby[i].distanceMiles);
  }
});

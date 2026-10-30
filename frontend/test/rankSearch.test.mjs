import assert from 'node:assert/strict';
import test from 'node:test';

import {
  rankSearchResults,
  scoreSearchMatch,
} from '../src/modules/foundation/search/rankSearch.ts';

test('title matches outrank location, which outrank description', () => {
  const items = [
    { title: 'Desk lamp', description: 'Great for a Dallas apartment' },
    { title: 'Sofa', location: 'Dallas, TX' },
    { title: 'Dallas Diwali Mela' },
  ];
  const ranked = rankSearchResults('dallas', items, (i) => i).map((i) => i.title);
  assert.deepEqual(ranked, ['Dallas Diwali Mela', 'Sofa', 'Desk lamp']);
});

test('every word must match some field', () => {
  assert.equal(
    scoreSearchMatch('room austin', { title: 'Shared room', location: 'Austin' }) > 0,
    true,
  );
  assert.equal(scoreSearchMatch('room dallas', { title: 'Shared room', location: 'Austin' }), 0);
});

test('a prefix title match beats a mid-word one, and ties keep order', () => {
  const items = [
    { title: 'Bedroom near campus' },
    { title: 'Room near campus' },
    { title: 'Room for rent' },
  ];
  const ranked = rankSearchResults('room', items, (i) => i).map((i) => i.title);
  assert.deepEqual(ranked, ['Room near campus', 'Room for rent', 'Bedroom near campus']);
});

test('empty queries match nothing', () => {
  assert.equal(scoreSearchMatch('   ', { title: 'Anything' }), 0);
});

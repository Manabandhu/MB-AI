import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countByCategory,
  exploreCategories,
  filterModules,
  groupByCategory,
  matchesQuery,
  normalizeSearch,
  recentModules,
  resultSummary,
} from '../src/modules/foundation/launcher/exploreFilters.ts';

const modules = [
  {
    key: 'rooms',
    label: 'Rooms',
    summary: 'Shared rooms, sublets, and roommates near you',
    keywords: ['housing', 'roommate', 'sublease', 'rent'],
    category: 'living',
    defaultRank: 1,
  },
  {
    key: 'rides',
    label: 'Rides',
    summary: 'Offer or find carpools and airport rides',
    keywords: ['carpool', 'ride share', 'airport'],
    category: 'living',
    defaultRank: 2,
  },
  {
    key: 'jobs',
    label: 'Jobs',
    summary: 'Job postings shared by members',
    keywords: ['work', 'career', 'h1b'],
    category: 'career',
    defaultRank: 4,
  },
  {
    key: 'referrals',
    label: 'Referrals',
    summary: 'Ask for or offer employee referrals',
    category: 'career',
    defaultRank: 5,
  },
  {
    key: 'immigration',
    label: 'Immigration',
    summary: 'Visa guides, checklists, and USCIS updates',
    keywords: ['visa', 'opt', 'green card', 'h1b'],
    category: 'essentials',
    defaultRank: 9,
  },
  {
    key: 'safety',
    label: 'Safety',
    summary: 'Trusted contacts, reports, and blocked users',
    keywords: ['report', 'emergency'],
    category: 'safety',
    defaultRank: 11,
  },
];

const keys = (list) => list.map((m) => m.key);

test('normalizeSearch folds case, accents and in-word punctuation', () => {
  assert.equal(normalizeSearch('  H-1B  Visa '), 'h1b visa');
  assert.equal(normalizeSearch('Café & résumé'), 'cafe resume');
  assert.equal(normalizeSearch('Living & getting around'), 'living getting around');
});

test('an empty query matches everything', () => {
  assert.equal(matchesQuery(modules[0], ''), true);
  assert.equal(matchesQuery(modules[0], '   '), true);
});

test('matches label, summary, category label and keywords by word prefix', () => {
  assert.deepEqual(keys(filterModules(modules, 'room', 'all')), ['rooms']);
  assert.deepEqual(keys(filterModules(modules, 'sublease', 'all')), ['rooms']);
  assert.deepEqual(keys(filterModules(modules, 'air', 'all')), ['rides']);
  assert.deepEqual(keys(filterModules(modules, 'getting around', 'all')), ['rooms', 'rides']);
  assert.deepEqual(keys(filterModules(modules, 'USCIS', 'all')), ['immigration']);
});

test('every term must match, and punctuation does not matter', () => {
  assert.deepEqual(keys(filterModules(modules, 'green card', 'all')), ['immigration']);
  assert.deepEqual(keys(filterModules(modules, 'green bike', 'all')), []);
  assert.deepEqual(keys(filterModules(modules, 'H-1B', 'all')), ['jobs', 'immigration']);
});

test('word-prefix matching avoids mid-word false positives', () => {
  // "port" is inside "airport" but starts no word.
  assert.deepEqual(keys(filterModules(modules, 'port', 'all')), []);
});

test('category filter combines with the query', () => {
  assert.deepEqual(keys(filterModules(modules, '', 'career')), ['jobs', 'referrals']);
  assert.deepEqual(keys(filterModules(modules, 'h1b', 'career')), ['jobs']);
  assert.deepEqual(keys(filterModules(modules, 'visa', 'career')), []);
});

test('label matches rank ahead of keyword matches', () => {
  const extra = [
    ...modules,
    {
      key: 'reports',
      label: 'Reports',
      summary: 'x',
      category: 'safety',
      defaultRank: 20,
    },
  ];
  assert.deepEqual(keys(filterModules(extra, 'report', 'all')), ['reports', 'safety']);
});

test('countByCategory counts matches per category and in total', () => {
  const all = countByCategory(modules, '');
  assert.equal(all.all, 6);
  assert.equal(all.living, 2);
  assert.equal(all.career, 2);
  assert.equal(all.community, 0);
  const visa = countByCategory(modules, 'h1b');
  assert.deepEqual(
    { all: visa.all, career: visa.career, essentials: visa.essentials, living: visa.living },
    { all: 2, career: 1, essentials: 1, living: 0 },
  );
});

test('groupByCategory follows category order and skips empty categories', () => {
  const sections = groupByCategory([...modules].reverse());
  assert.deepEqual(
    sections.map((s) => s.category),
    ['living', 'career', 'essentials', 'safety'],
  );
  assert.deepEqual(keys(sections[0].modules), ['rooms', 'rides']);
  assert.equal(sections[0].label, exploreCategories[0].label);
});

test('recentModules keeps visit order, drops unknown ids and duplicates, and caps the count', () => {
  const visits = [
    { moduleId: 'safety' },
    { moduleId: 'gone' },
    { moduleId: 'rooms' },
    { moduleId: 'safety' },
    { moduleId: 'jobs' },
    { moduleId: 'rides' },
    { moduleId: 'immigration' },
  ];
  assert.deepEqual(keys(recentModules(modules, visits)), ['safety', 'rooms', 'jobs', 'rides']);
  assert.deepEqual(keys(recentModules(modules, visits, 2)), ['safety', 'rooms']);
  assert.deepEqual(recentModules(modules, []), []);
});

test('resultSummary reads naturally', () => {
  assert.equal(resultSummary(1, '', 'all'), '1 feature');
  assert.equal(resultSummary(3, ' visa ', 'all'), '3 features for “visa”');
  assert.equal(resultSummary(2, '', 'career'), '2 features in Career');
  assert.equal(resultSummary(0, 'x', 'safety'), '0 features for “x” in Safety');
});

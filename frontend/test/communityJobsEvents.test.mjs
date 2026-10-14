import assert from 'node:assert/strict';
import test from 'node:test';

import { nextReaction, withViewerReaction } from '../src/modules/community/utils/reactions.ts';
import {
  addHours,
  eventTimeErrors,
  nextWeekday,
  rsvpIs,
} from '../src/modules/events/utils/eventTime.ts';
import {
  activeFilterCount,
  DEFAULT_JOB_FILTERS,
  filterJobs,
  filtersFromParams,
  filtersToQuery,
} from '../src/modules/jobs/utils/jobFilters.ts';
import {
  jobFormSchema,
  parseSalary,
  toJobInput,
  toJobUpdate,
} from '../src/modules/jobs/utils/jobForm.ts';
import {
  isOpenReferral,
  matchesReferral,
  referralCategories,
} from '../src/modules/referrals/utils/referralStatus.ts';

const post = {
  id: 'p',
  communityId: 'c',
  ownerId: 'o',
  authorName: 'Asha',
  title: 't',
  body: 'b',
  createdAt: '2026-01-01T00:00:00Z',
  commentCount: 0,
  reactionCounts: { LIKE: 2 },
  reactionCount: 2,
  viewerReaction: null,
};

test('pressing your current reaction removes it, another one replaces it', () => {
  assert.equal(nextReaction('LIKE', 'LIKE'), null);
  assert.equal(nextReaction('LIKE', 'HEART'), 'HEART');
  assert.equal(nextReaction(null, 'HELPFUL'), 'HELPFUL');
});

test('optimistic reaction update moves exactly one count', () => {
  const liked = withViewerReaction(post, 'LIKE');
  assert.deepEqual(
    [liked.reactionCounts.LIKE, liked.reactionCount, liked.viewerReaction],
    [3, 3, 'LIKE'],
  );
  const switched = withViewerReaction(liked, 'HEART');
  assert.deepEqual(switched.reactionCounts, { LIKE: 2, HEART: 1 });
  assert.equal(switched.reactionCount, 3);
  const cleared = withViewerReaction(switched, null);
  assert.deepEqual(
    [cleared.reactionCounts.HEART, cleared.reactionCount, cleared.viewerReaction],
    [0, 2, null],
  );
});

test('nextWeekday finds the real next Saturday/Sunday in local time', () => {
  const wed = new Date(2026, 9, 14, 10, 0); // Wednesday
  const sat = nextWeekday(6, 18, wed);
  assert.equal(sat.getDay(), 6);
  assert.equal(sat.getDate(), 17);
  assert.equal(sat.getHours(), 18);
  assert.equal(nextWeekday(0, 11, wed).getDate(), 18);
  assert.equal(nextWeekday(6, 18, wed, 1).getDate(), 24);
  // Saturday evening already passed: next week's Saturday.
  const satLate = new Date(2026, 9, 17, 20, 0);
  assert.equal(nextWeekday(6, 18, satLate).getDate(), 24);
  // Saturday morning: today still counts.
  assert.equal(nextWeekday(6, 18, new Date(2026, 9, 17, 9, 0)).getDate(), 17);
});

test('event end must be after start, start in the future', () => {
  const now = new Date(2026, 9, 14, 10, 0);
  const start = new Date(2026, 9, 17, 18, 0);
  assert.deepEqual(eventTimeErrors(start, addHours(start, 2), now), {});
  assert.ok(eventTimeErrors(start, start, now).end);
  assert.ok(eventTimeErrors(new Date(2026, 9, 1), addHours(start, 1), now).start);
  assert.ok(rsvpIs('GOING', 'going'));
  assert.ok(!rsvpIs(undefined, 'going'));
});

const job = (over) => ({
  id: Math.random().toString(),
  ownerId: 'o',
  title: 'Engineer',
  status: 'open',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...over,
});

test('job filters use real fields and hide closed postings', () => {
  const jobs = [
    job({
      id: 'a',
      isRemote: true,
      salaryMax: 200000,
      employmentType: 'Full-time',
      category: { id: 'c1' },
    }),
    job({ id: 'b', location: 'Austin, TX', salaryMin: 90000, createdAt: '2026-02-01T00:00:00Z' }),
    job({ id: 'c', status: 'CLOSED' }),
  ];
  assert.deepEqual(
    filterJobs(jobs, DEFAULT_JOB_FILTERS).map((j) => j.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    filterJobs(jobs, { ...DEFAULT_JOB_FILTERS, remoteOnly: true }).map((j) => j.id),
    ['a'],
  );
  assert.deepEqual(
    filterJobs(jobs, { ...DEFAULT_JOB_FILTERS, location: 'austin' }).map((j) => j.id),
    ['b'],
  );
  assert.deepEqual(
    filterJobs(jobs, { ...DEFAULT_JOB_FILTERS, minSalary: 150000 }).map((j) => j.id),
    ['a'],
  );
  assert.deepEqual(
    filterJobs(jobs, { ...DEFAULT_JOB_FILTERS, categoryId: 'c1' }).map((j) => j.id),
    ['a'],
  );
  assert.deepEqual(
    filterJobs(jobs, { ...DEFAULT_JOB_FILTERS, sort: 'salary' }).map((j) => j.id),
    ['a', 'b'],
  );
});

test('job filters round-trip through the URL', () => {
  const filters = {
    ...DEFAULT_JOB_FILTERS,
    keyword: 'java',
    remoteOnly: true,
    minSalary: 100000,
    employmentType: 'Contract',
  };
  const params = Object.fromEntries(new URLSearchParams(filtersToQuery(filters)));
  assert.deepEqual(filtersFromParams(params), filters);
  assert.equal(activeFilterCount(filters), 3);
});

test('job form requires a category and builds the backend input', () => {
  const base = {
    categoryId: '',
    title: 'Dev',
    company: '',
    location: '',
    isRemote: false,
    employmentType: '',
    salaryMin: '100,000',
    salaryMax: '$90000',
    applicationUrl: 'ftp://x',
    description: 'Role',
  };
  const bad = jobFormSchema.safeParse(base);
  assert.equal(bad.success, false);
  const paths = bad.error.issues.map((i) => i.path[0]);
  assert.ok(paths.includes('categoryId'));
  assert.ok(paths.includes('applicationUrl'));
  const ok = jobFormSchema.parse({
    ...base,
    categoryId: 'c',
    salaryMax: '120000',
    applicationUrl: 'https://a.co/x',
  });
  const input = toJobInput(ok);
  assert.deepEqual(
    [input.categoryId, input.salaryMin, input.salaryMax, input.company],
    ['c', 100000, 120000, undefined],
  );
  assert.equal(parseSalary(''), undefined);
});

test('referral status and filters are case-insensitive', () => {
  assert.ok(isOpenReferral({ status: 'PENDING' }));
  assert.ok(!isOpenReferral({ status: 'closed' }));
  assert.deepEqual(
    referralCategories([{ category: 'Tech' }, { category: 'tech' }, { category: 'Legal' }, {}]),
    ['Legal', 'Tech'],
  );
  const r = { title: 'Google SWE', description: null, category: 'Tech' };
  assert.ok(matchesReferral(r, 'google', 'TECH'));
  assert.ok(!matchesReferral(r, '', 'Legal'));
});

test('job edit payload clears emptied fields instead of keeping them', () => {
  const update = toJobUpdate({
    categoryId: 'c',
    title: ' Dev ',
    company: '',
    location: '',
    isRemote: true,
    employmentType: '',
    salaryMin: '',
    salaryMax: '150,000',
    applicationUrl: '',
    description: 'Role',
  });
  assert.deepEqual(
    [update.company, update.location, update.employmentType, update.applicationUrl],
    ['', '', '', ''],
  );
  assert.equal(update.clearSalary, true);
  assert.equal(update.salaryMin, undefined);
  assert.equal(update.salaryMax, 150000);
  assert.equal(update.title, 'Dev');
});

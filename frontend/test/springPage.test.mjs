import assert from 'node:assert/strict';
import test from 'node:test';
import { toPage } from '../src/lib/springPage.ts';

test('reads the PagedModel body and derives last from the page metadata', () => {
  const body = { content: [{ id: 'a' }, { id: 'b' }], page: { size: 2, number: 0, totalElements: 5, totalPages: 3 } };
  assert.deepEqual(toPage(body, 0, 2), {
    content: [{ id: 'a' }, { id: 'b' }],
    number: 0,
    size: 2,
    totalElements: 5,
    totalPages: 3,
    last: false,
  });
  const final = toPage({ content: [{ id: 'e' }], page: { size: 2, number: 2, totalElements: 5, totalPages: 3 } });
  assert.equal(final.last, true);
  assert.equal(final.number, 2);
});

test('an empty PagedModel is the last page', () => {
  const page = toPage({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  assert.equal(page.last, true);
  assert.equal(page.totalElements, 0);
});

test('still reads the legacy flat PageImpl body', () => {
  const page = toPage({ content: [1, 2], number: 1, size: 2, totalElements: 6, totalPages: 3, last: false });
  assert.deepEqual(page, { content: [1, 2], number: 1, size: 2, totalElements: 6, totalPages: 3, last: false });
});

test('a bare array is a single final page', () => {
  assert.deepEqual(toPage([1, 2, 3], 0, 50), {
    content: [1, 2, 3],
    number: 0,
    size: 50,
    totalElements: 3,
    totalPages: 1,
    last: true,
  });
});

test('missing metadata falls back to the requested page and size', () => {
  const page = toPage({ content: [1, 2] }, 3, 2);
  assert.equal(page.number, 3);
  assert.equal(page.size, 2);
  assert.equal(page.totalElements, 8);
  assert.equal(page.totalPages, 4);
  assert.equal(page.last, true);
});

test('a body that is not a page throws instead of looking empty', () => {
  assert.throws(() => toPage(null));
  assert.throws(() => toPage({ error: 'boom' }));
  assert.throws(() => toPage({ content: 'nope' }));
});

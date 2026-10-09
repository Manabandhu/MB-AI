import assert from 'node:assert/strict';
import test from 'node:test';

import {
  friendlyAuthError,
  isValidEmail,
  parseAuthRedirect,
  passwordProblem,
  phoneLastFour,
  toE164,
} from '../src/modules/auth/authHelpers.ts';

test('validates emails', () => {
  assert.equal(isValidEmail(' priya@example.com '), true);
  assert.equal(isValidEmail('priya@example'), false);
  assert.equal(isValidEmail('not an email'), false);
});

test('explains what a password still needs', () => {
  assert.match(passwordProblem('short1'), /at least 8/);
  assert.match(passwordProblem('onlyletters'), /letter and one number/);
  assert.equal(passwordProblem('correct-horse-1'), null);
});

test('builds E.164 numbers and masks them', () => {
  assert.equal(toE164('+1', '(512) 555-0123'), '+15125550123');
  assert.equal(phoneLastFour('+15125550123'), '0123');
});

test('maps Supabase errors to plain language', () => {
  assert.match(friendlyAuthError(new Error('Invalid login credentials')), /don't match/);
  assert.match(friendlyAuthError(new Error('User already registered')), /already exists/);
  assert.match(friendlyAuthError(new Error('Token has expired or is invalid')), /expired/);
  assert.match(friendlyAuthError(new TypeError('Failed to fetch')), /can't reach/);
  assert.equal(
    friendlyAuthError(new Error('weird internal thing')),
    'Something went wrong. Please try again.',
  );
});

test('parses OAuth and recovery redirects', () => {
  assert.deepEqual(
    parseAuthRedirect('manabandhu://auth/callback#access_token=a&refresh_token=r&type=bearer'),
    {
      kind: 'session',
      accessToken: 'a',
      refreshToken: 'r',
    },
  );
  assert.deepEqual(parseAuthRedirect('https://app.example/auth/callback?code=xyz'), {
    kind: 'code',
    code: 'xyz',
  });
  assert.deepEqual(
    parseAuthRedirect(
      'https://app.example/auth/callback#error=access_denied&error_description=User+cancelled',
    ),
    {
      kind: 'error',
      message: 'User cancelled',
    },
  );
  assert.deepEqual(parseAuthRedirect('https://app.example/auth/callback'), { kind: 'none' });
});

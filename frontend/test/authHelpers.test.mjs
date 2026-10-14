import assert from 'node:assert/strict';
import test from 'node:test';

import {
  friendlyAuthError,
  hasAcceptedTerms,
  OTP_CODE_LENGTH,
  PASSWORD_RULES,
  parsePhoneInput,
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

test('a pasted international number keeps its own country code', () => {
  assert.deepEqual(parsePhoneInput('+1', '+14695550123'), { ok: true, e164: '+14695550123' });
  assert.deepEqual(parsePhoneInput('+91', '+1 (469) 555-0123'), { ok: true, e164: '+14695550123' });
  assert.deepEqual(parsePhoneInput('+1', '0044 7700 900123'), { ok: true, e164: '+447700900123' });
});

test('national numbers get the selected dial code without doubling it', () => {
  assert.deepEqual(parsePhoneInput('+1', '(469) 555-0123'), { ok: true, e164: '+14695550123' });
  assert.deepEqual(parsePhoneInput('+1', '1 469 555 0123'), { ok: true, e164: '+14695550123' });
  assert.deepEqual(parsePhoneInput('+44', '07700 900123'), { ok: true, e164: '+447700900123' });
  assert.equal(parsePhoneInput('+1', '555').ok, false);
  assert.equal(parsePhoneInput('+1', '+12').ok, false);
});

test('password rules match the validator and OTP length matches Supabase config', () => {
  assert.match(PASSWORD_RULES, /minlength: 8;/);
  assert.match(PASSWORD_RULES, /required: digit;/);
  assert.equal(OTP_CODE_LENGTH, 6);
});

test('terms consent is recorded only when a version is present', () => {
  assert.equal(hasAcceptedTerms({ terms_version: '2026-10-11' }), true);
  assert.equal(hasAcceptedTerms({ terms_version: '' }), false);
  assert.equal(hasAcceptedTerms({}), false);
  assert.equal(hasAcceptedTerms(null), false);
});

test('a country code typed without + is not added twice', () => {
  assert.deepEqual(parsePhoneInput('+91', '91 98765 43210'), { ok: true, e164: '+919876543210' });
  assert.deepEqual(parsePhoneInput('+91', '98765 43210'), { ok: true, e164: '+919876543210' });
  assert.deepEqual(parsePhoneInput('+44', '44 7700 900123'), { ok: true, e164: '+447700900123' });
  assert.deepEqual(parsePhoneInput('+44', '7700 900123'), { ok: true, e164: '+447700900123' });
  assert.deepEqual(parsePhoneInput('+1', '14695550123'), { ok: true, e164: '+14695550123' });
  // A national number that merely starts with the code's digits is kept as is.
  assert.deepEqual(parsePhoneInput('+91', '9198765432'), { ok: true, e164: '+919198765432' });
});

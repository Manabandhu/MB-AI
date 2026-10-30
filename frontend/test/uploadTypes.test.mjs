import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadContentType } from '../src/modules/shared/hooks/uploadTypes.ts';

test('known image types pass through', () => {
  assert.equal(uploadContentType('image/png', 'file:///a.png'), 'image/png');
  assert.equal(uploadContentType('image/jpg', 'x'), 'image/jpeg');
});

test('the extension is used when the picker gives no type', () => {
  assert.equal(uploadContentType(null, 'file:///photos/IMG_1.HEIC'), 'image/heic');
  assert.equal(uploadContentType(undefined, 'https://x/y.jpeg?w=1'), 'image/jpeg');
});

test('anything else is refused', () => {
  assert.equal(uploadContentType('video/mp4', 'file:///a.mp4'), null);
  assert.equal(uploadContentType('', 'file:///a.svg'), null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { darkPalette, palette } from '../../packages/design-system/src/tokens.ts';

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const light = luminance(a), dark = luminance(b);
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
}
for (const [name, theme] of [['light', palette], ['dark', darkPalette]]) {
  test(`${name} text and semantic accents meet AA on standard surfaces`, () => {
    for (const surface of ['surface', 'background']) {
      for (const foreground of ['ink', 'muted', 'primary', 'teal', 'warm', 'success', 'error']) {
        assert.ok(contrast(theme[foreground], theme[surface]) >= 4.5, `${foreground} on ${surface}`);
      }
    }
  });
}

for (const [name, theme] of [['light', palette], ['dark', darkPalette]]) {
  test(`${name} solid controls and muted text on tonal surfaces meet AA`, () => {
    for (const background of ['primary', 'error']) {
      assert.ok(contrast(theme.onPrimary, theme[background]) >= 4.5, `onPrimary on ${background}`);
    }
    for (const background of ['surfaceContainerLow', 'surfaceContainer']) {
      assert.ok(contrast(theme.muted, theme[background]) >= 4.5, `muted on ${background}`);
    }
  });
}

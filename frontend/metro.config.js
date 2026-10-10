// Production web/native bundles drop unused exports (e.g. the ~1,700 icons we do not use from the Lucide barrel).
// Expo reads these flags at bundle time; dev servers ignore tree shaking.
process.env.EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH ??= '1';
process.env.EXPO_UNSTABLE_TREE_SHAKING ??= '1';

const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = async () => ({
  transform: { experimentalImportSupport: true, inlineRequires: true },
});

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind-types.d.ts',
  extraThemes: ['dark'],
});

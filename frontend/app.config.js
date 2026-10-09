// Native Google Maps key for Android builds comes from the environment (EAS secret or local shell), never from
// app.json. Restrict the key in Google Cloud to this app's package name and signing certificate.
module.exports = ({ config }) => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  if (!apiKey) return config;
  return {
    ...config,
    android: {
      ...config.android,
      config: { ...config.android?.config, googleMaps: { apiKey } },
    },
  };
};

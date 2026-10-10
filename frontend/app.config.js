// Build-time config that depends on the environment; everything static lives in app.json.
// - GOOGLE_MAPS_ANDROID_API_KEY: native Google Maps key for Android builds (EAS secret or local shell). Restrict it in
//   Google Cloud to this app's package name and signing certificate. Never commit it to app.json.
// - APP_LINK_DOMAIN: the public web domain (for example app.manabandhu.com). When set, shared links open the app
//   through iOS universal links and Android App Links; the domain must serve the matching association files.
module.exports = ({ config }) => {
  const next = { ...config, ios: { ...config.ios }, android: { ...config.android } };

  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  if (apiKey) {
    next.android.config = { ...config.android?.config, googleMaps: { apiKey } };
  }

  const domain = process.env.APP_LINK_DOMAIN;
  if (domain) {
    next.ios.associatedDomains = [`applinks:${domain}`];
    next.android.intentFilters = [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: domain }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ];
  }

  return next;
};

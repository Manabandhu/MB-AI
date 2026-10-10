import { brand } from '@manabandhu/design-system';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only document shell (static export). Gives every page search and social previews, installability (PWA
 * manifest, icons, theme colour), and a background that matches the theme before JavaScript loads.
 */
export default function Root({ children }: PropsWithChildren) {
  const title = `${brand.name} · ${brand.tagline}`;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
        <title>{title}</title>
        <meta content={brand.description} name="description" />
        <meta content="#faf8ff" media="(prefers-color-scheme: light)" name="theme-color" />
        <meta content="#0f1525" media="(prefers-color-scheme: dark)" name="theme-color" />
        <meta content="light dark" name="color-scheme" />
        <link href="/manifest.webmanifest" rel="manifest" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="default" name="apple-mobile-web-app-status-bar-style" />
        <meta content={brand.name} name="apple-mobile-web-app-title" />
        <meta content="website" property="og:type" />
        <meta content={brand.name} property="og:site_name" />
        <meta content={title} property="og:title" />
        <meta content={brand.description} property="og:description" />
        <meta content="/og-image.png" property="og:image" />
        <meta content="summary_large_image" name="twitter:card" />
        <meta content={title} name="twitter:title" />
        <meta content={brand.description} name="twitter:description" />
        <meta content="/og-image.png" name="twitter:image" />
        <ScrollViewStyleReset />
        {/* Paint the right background before the bundle loads, so dark-mode users never see a white flash. */}
        <style>{`html,body{background:#faf8ff}@media (prefers-color-scheme: dark){html,body{background:#0f1525}}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}

# Premium visual browsing

This describes the preceding redesign. The current revision simplifies its discovery surfaces; see [Quiet, task-first UI](quiet-ui.md) and the [current screenshot gallery](ui-screenshots/README.md).

The app combines restrained premium styling with visual category browsing: warm neutral surfaces, charcoal feature panels, strong typography, original SVG illustrations, prominent search, and clear navigation. Home, Explore, search, Profile, authentication, module discovery, shared controls, and theme colors use the updated system. Events and Referrals now use consistent responsive cards, filters, loading, empty, and retry states.

Category art is decorative; it does not substitute for actual listing photos. Marketplace retains real listing images, prices, and saved-item persistence. Referral details show actual record fields and route to the existing offer/request forms. The previous simulated introduction-success modal and temporary bookmark state were removed. No runtime dependencies, backend contracts, or routes were added.

## Validation

- 101 frontend and 14 shared-package tests passed.
- Repository verification passed: types, lint, contracts, skills, routes, screen catalog, design checks, and secret checks.
- 180 responsive checks covered 18 main screens at five widths in both themes. A final capture reran 72 checks at phone and desktop widths.
- All 123 routes were reviewed in both themes: 246 checks without rendering errors or horizontal overflow.
- Live theme persistence, saved jobs, marketplace keyboard saving and backend persistence, category navigation, referral details/retry/navigation, and authentication form checks passed using the local backend.
- Web, iOS, and Android Expo bundle exports passed. Physical-device testing and external provider integrations were not performed.
- The tracked legacy design violations decreased from 466 to 86; remaining legacy areas include administration, map styling, and branding.

[View the screenshot gallery](ui-screenshots/README.md). Screenshots use local test data and include honest empty states.

# Quiet, task-first UI

This describes a preceding revision. See [Research and the resulting design](design-research.md) for the current implementation and references.

Home now starts with search and six clearly labeled destinations. The promotional hero, invitation, assistant promotion, and metrics no longer compete for attention. Local module widgets appear only when the member opens the optional feed; this also avoids their requests on the initial Home mount. All features remain accessible through Explore and search.

Shared destination cards use neutral icons, readable labels, and a single navigation target. Module introductions use text and a divider rather than decorative banners. Secondary actions use neutral outlined surfaces; the accent is reserved for primary actions. Profile follows the same surface treatment. Phone shortcuts use two columns, with three on larger windows. Light and dark themes, existing routes, and real data sources are preserved.

This revision changes the shared design system and core discovery surfaces. It does not claim to reproduce CRED or to have individually rebuilt every detail and form screen.

## Validation

- 101 frontend tests and 14 shared-package tests passed.
- Repository verification passed, including types, lint, contracts, skills, route catalog, design ratchet, and secret checks.
- 180 responsive screen checks passed across 18 main screens, five widths (320, 390, 820, 1180, 1440), and both themes. Keyboard destination navigation, feed disclosure, filters, launcher, and saved-job flows passed.
- All 123 routes were reviewed in both themes: 246 checks with no rendering errors or horizontal overflow.
- Welcome and sign-in views, validation, password visibility, and signup keyboard consent checks passed.
- Web, iOS, and Android Expo exports passed. Physical devices and external provider integrations were not tested.

[View the 84 fresh screenshots](ui-screenshots/README.md).

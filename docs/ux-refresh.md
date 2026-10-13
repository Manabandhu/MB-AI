# ManaBandhu UX refresh

Branch: `codex/ux-refresh`, based on `claude/loving-wright-3a3bah`.

The app uses a calmer neutral canvas, expressive violet actions, clearer headings, rounded surfaces, and consistent controls. The refresh applies through the shared screen system and live theme factories rather than maintaining a different visual language in each module. It adds no runtime dependencies.

## What changed

- Shared cards, fields, buttons, chips, headers, list rows, states, message bubbles, sheets, and legacy component adapters follow one light/dark visual system. Fields expose validation and helper descriptions to assistive technology. Keyboard focus and activation work for segments, ratings, person links, consent, and widget links.
- Home exposes location, search, six readable shortcuts, and the complete feature directory. Explore uses a compact grid, recent destinations, category filters, and instant local search.
- The catalog-backed feature launcher works from Home, tab headers, the tablet rail, desktop navigation, and deep-screen shortcuts. Press **Ctrl/Cmd K** to open it, type a task, and **Escape** to close it. Results are virtualized; finding a destination requires no API request. Item-specific and onboarding routes are excluded. Admin entries follow trusted roles; automations require Super Admin.
- Deep screens have a Home / Jump to / Saved dock that hides while the native keyboard is open. Existing back paths, safe areas, primary actions, confirmations, and server permissions are preserved.
- Search loads listing categories after typing and filters queries by the selected category. Saved collections retain available results while showing failures honestly. Settings groups appearance/language, notifications, maps, account/data, and safety.
- Jobs filters now actually apply their keyword, location, and remote-only selections. Bookmarks persist on the device and the saved page resolves those IDs directly, in batches of 12, so older bookmarks are not lost outside the latest jobs page; the UI explicitly describes them as device-local.
- Native layouts on 57 legacy screens were moved to memoized, live-palette factories. Touch/accessibility improvements covered 37 of those screens. Module headers were standardized for jobs, events, immigration, referrals, expenses, utilities, and safety.
- Web adaptive layouts use a stable first viewport during static rendering/hydration, then apply the real viewport. Native dimensions remain immediate. New navigation labels support English, Telugu, and Hindi.
- Motion remains optional; reduced motion removes hover movement and entrance animation. Staggering is capped so a long list does not delay access. System fonts avoid a font download before first paint.

## Coverage

The canonical catalog still contains 123 routes. Redirects share their destination UI; create/edit screens share forms where appropriate. Rooms, rides, marketplace, and notifications inherit the refreshed shared components. Older native layouts use the same live palette. API contracts and backend application code are unchanged.

| Module | Routes |
| --- | ---: |
| Foundation and authentication | 27 |
| Notifications | 3 |
| Rooms | 10 |
| Rides | 11 |
| Jobs | 6 |
| Referrals | 5 |
| Community | 6 |
| Chat | 4 |
| Immigration | 10 |
| Expenses | 6 |
| Events | 6 |
| Marketplace | 8 |
| Utilities | 4 |
| Safety | 4 |
| Assistant | 3 |
| Admin | 10 |

## Validation

Use the existing environment tool activation, then run `pnpm verify`, `pnpm test`, and the Expo web export. Frontend tests include task-search eligibility/matching and AA contrast for text and semantic accents on standard surfaces in both themes. The design baseline was reduced rather than relaxed.

Validation passed: 97 frontend tests, 14 shared-package tests, 235 backend tests, `pnpm verify`, the web export, and 277 local authorization smoke checks. Chromium passed 246 route/theme render checks (123 routes in light and dark), 80 layout checks at 320/390/820/1180/1440px, and launcher keyboard/navigation flows at every size and theme. No runtime errors or document overflow were observed. Targeted browser checks also passed sign-in validation, password reveal, keyboard consent, Jobs filter application, saved-job reloads, unavailable-job errors, and bookmark removal.

Browser review uses the exported app against the repository's local Postgres/auth/backend stack. Route checks include redirects and missing-record states; they do not assert that a missing record exists. Responsive review covers phone, tablet, landscape tablet, and desktop. Native device builds, production Supabase authentication, and external maps/push/upload providers need their normal integration validation.

Review artifacts and detailed run results are under `/workspace/.onboarding/ux-artifacts/` in the prepared cloud workspace. These are local review artifacts, not publicly accessible web links.

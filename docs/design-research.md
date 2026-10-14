# Research and the resulting design

The previous revisions changed surface treatments while keeping a similar arrangement of cards. This revision changes the information hierarchy, navigation frame, and discovery model.

## What was inspected

The environment initially blocked the reference sites. After its network access was updated, CRED, Linear, Airbnb, Revolut, Stripe, Apple, Carbon, and Fluent were reachable. Public web pages were fetched; CRED, Linear, Airbnb, Revolut, and Stripe were rendered at phone and desktop widths. Official App Store metadata and three promotional screenshots each for CRED, Revolut, and Airbnb were downloaded, inspected, and used as visual references. These are public website and store observations, not a usability study or a review of authenticated app sessions. Some animated web content and Airbnb listing content did not finish rendering in the first capture; conclusions about their app screens use the official store images instead.

| Reference | Observed pattern | Decision for ManaBandhu |
| --- | --- | --- |
| [CRED website](https://cred.club/) and [official iOS listing](https://apps.apple.com/in/app/id1428580080) | Large serif headlines, restrained color, strongly separated tasks, dominant primary actions | System-serif editorial headings on Home and Welcome; concise task controls; no copied financial imagery or 3D dependency |
| [Airbnb website](https://www.airbnb.com/) and [official iOS listing](https://apps.apple.com/app/id401626263) | Prominent search, visible search scope, short top-level browsing choices, real listing imagery and price hierarchy | Prominent global search and explicit city scope; Live / Work / Connect groups; retain real module-owned listing content |
| [Revolut website](https://www.revolut.com/en-US/) and [official iOS listing](https://apps.apple.com/app/id932493382) | Large readable task headings, compact action groups, strong selected-state contrast | Selected segments and primary navigation use inverse contrast; secondary actions stay neutral |
| [Linear website](https://linear.app/) | Short global navigation, large type, quiet separators; public page text includes the product workspace preview | Persistent desktop orientation and clearer typography; no claims about logged-in Linear interactions |
| [Stripe website](https://stripe.com/) | Aligned content grid, clear hierarchy between main statement and next actions | Consistent spacing and content alignment; omit decorative gradients from task-heavy screens |
| [shadcn dashboard implementation](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/blocks/dashboard-01/page.tsx) | Sidebar separated from the content pane and local header | Desktop sidebar replaces the old horizontal top navigation while using the existing tab navigator |
| [Carbon grid](https://carbondesignsystem.com/elements/2x-grid/overview/), [spacing](https://carbondesignsystem.com/elements/spacing/overview/), and [empty states](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/patterns/empty-states-pattern/index.mdx) | Consistent spacing rhythm and useful empty-state next steps | Shared screen gutters and card rhythm; real loading, empty, and retry states remain visible |
| [Carbon tabs guidance](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/components/tabs/usage.mdx) | Use a content switcher when filtering related content; keep labels short | Home intent choices are a radio content switcher, not additional navigation tabs |
| [Fluent button guidance](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/stories/src/Button/ButtonBestPractices.md) | One primary action; clear verb/noun labels; navigation uses links | AppButton route actions expose link semantics; selected and primary actions are visually distinct |
| [GOV.UK question pages](https://github.com/alphagov/govuk-design-system/blob/main/src/patterns/question-pages/index.md) and [validation](https://github.com/alphagov/govuk-design-system/blob/main/src/patterns/validation/index.md) | Ask only necessary questions, preserve entered answers, explain recovery | Preserve existing form data/validation flows and associate shared errors with fields; do not add onboarding questions for visual effect |
| [Apple layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) and [Fluent layout](https://fluent2.microsoft.design/layout) | Adaptive layout is a first-class design concern | Keep one native/web implementation with phone tabs, tablet rail, desktop sidebar, safe areas, and keyboard access |

## Resulting experience

Home no longer opens with six large shortcut cards. It has an editorial introduction, one prominent search entry, an explicit location selector, and Live / Work / Connect choices. Each choice mounts just two relevant module widgets, with three contextual links. Pull-to-refresh still refreshes the live module data. Only module public components fetch business data.

Explore becomes a scannable directory with readable descriptions, recent destinations, category counts, search, and keyboard navigation. Desktop uses the same persistent sidebar on primary tabs and signed-in listing/detail/form pages, with feature search, saved items, settings, and notifications. Phone navigation and the tablet rail preserve the same primary routes and unread badges.

Welcome becomes a single clear introduction with signup and signin actions. Shared surfaces use warm paper, restrained forest/ink actions, inverse selected states, calmer empty-state icon treatment, and consistent spacing. Editorial type uses installed system fonts; no font download or new dependency is required. Promotional module introductions without an action or supporting content are omitted; real detail headings remain.

The revision changes the core shell and shared system. It does not pretend that every business form was independently rebuilt, that consumer apps were fully usability-tested, or that synthetic balances and listing photos represent real ManaBandhu data.

[View the current UI screenshots](ui-screenshots/README.md).

## Validation

- 101 frontend tests and 14 shared-package tests passed.
- Repository verification passed: lint, types, contracts, skills, route catalog, screen catalog, design ratchet, and secret checks. The legacy design baseline is now 85 violations across 12 files.
- 180 responsive checks passed across 18 main screens, five widths (320, 390, 820, 1180, 1440), and both themes. Home intent switching, directory keyboard navigation, job filters, saved jobs, launcher, and desktop sidebar navigation passed.
- All 123 routes passed at phone width in both themes: 246 checks with no rendering errors or horizontal overflow.
- Welcome/signup/signin checks passed, including explicit phone heading/action/feature overlap checks.
- Web, iOS, and Android Expo exports passed. Physical-device testing and authenticated sessions in reference apps were not performed.
- The gallery contains 92 fresh captures, including Home Live/Work/Connect, phone/desktop light/dark views, and selected saved/launcher states.

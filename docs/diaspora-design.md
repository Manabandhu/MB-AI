# Designing for community abroad

The target includes South Indians and a broader South Asian diaspora, across languages, generations, backgrounds, and places of residence. No reviewed source establishes a single color palette or app layout that most of this audience prefers. The warm paper/indigo direction is a design hypothesis, with light/dark choice preserved, rather than an ethnic preference claim.

## Evidence and limits

| Source inspected | Finding relevant to the product | Application |
| --- | --- | --- |
| [Carnegie: Social Realities of Indian Americans, 2020 IAAS](https://carnegieendowment.org/research/2021/06/social-realities-of-indian-americans-results-from-the-2020-indian-american-attitudes-survey?lang=en) | A survey of 1,200 Indian American residents describes varied identities, generations, and social networks; community identity is not uniform | Offer community connection and practical local help without assigning religion, nationality, language, or tastes to an individual |
| [W3C: language negotiation](https://www.w3.org/International/questions/qa-site-conneg) | Let people easily override the suggested language and remember their choice; geography is not a reliable language preference | Put language selection on Home and Welcome, persist the explicit choice, and keep English available |
| [W3C: Indic graphemes](https://www.w3.org/International/questions/qa-indic-graphemes) | Combining signs and conjuncts must survive text processing; spacing and truncation need care | Preserve native-script letters/marks/joiners in discovery, remove negative tracking from Indic headings, and use readable system text |
| [Meetup](https://www.meetup.com/) | Its public product presentation leads with local interests becoming friendships | Keep community/events accessible as actual local destinations rather than decorative cultural badges |
| [Wise's US-to-India page](https://wise.com/us/send-money/send-money-to-india) and [Remitly's India page](https://www.remitly.com/us/en/india) | Public products aimed at people across borders explain practical tasks, costs, and service scope | Use clear task labels and honest scope; retain real data and actual existing capabilities rather than inventing remittance features |

These are a combination of social research, internationalization guidance, and public product observations. They are not color-preference research, an exhaustive survey of South Asians, or authenticated-app usability studies. The Indian American study cannot stand in for Pakistani, Bangladeshi, Sri Lankan, Nepali, or every other South Asian community, nor every country of residence. Translations are initial product copy and need native-speaker review before release.

## Implemented experience

- Warm neutral canvas, indigo primary actions, restrained accents, and light/dark themes across the shared system. No religious icons or national flags are used to presume an identity.
- Clearer, friendlier system headings and a belonging-focused introduction: “A new place. A familiar circle.”
- Visible language picker on Home and Welcome, also available in Appearance. It uses comfortably sized rows in a sheet rather than squeezing language names into a segmented control.
- English, Hindi, Telugu, Tamil, Kannada, and Malayalam core journey options. New languages cover the core journey and directory labels; untranslated feature descriptions/content deliberately remain English. This limitation is stated in the picker.
- Native-script aliases work in Explore and the feature launcher, even when the interface is English. English search remains available when a native interface language is selected. The previous ASCII-only Explore normalization incorrectly treated native-script queries as empty and matched every feature.
- An optional “Getting settled?” section links to the existing immigration resources, expenses, and safety tools. It does not presume visa status or require another onboarding step.
- City and language remain independent explicit choices. Existing US-only city-directory scope is preserved; this UI update does not claim support for other countries.
- Provider-confirmed trust facts, real listings, real errors/empty states, and existing route ownership remain intact. No identity inference, new tracking, runtime dependencies, or backend contract changes were introduced.

[View the updated UI](ui-screenshots/README.md).

## Validation

- 104 frontend tests and 14 package tests passed, including native-script discovery regressions and contrast checks in both themes.
- Repository verification passed, including lint, types, routes, contracts, skills, screen catalog, design ratchet, and secret checks.
- 180 responsive checks covered 18 main screens at 320/390/820/1180/1440 widths in both themes.
- All 123 routes passed at phone width in both themes: 246 checks without rendering errors or horizontal overflow.
- 144 multilingual layout checks covered Home, Explore, Settings, and Welcome in six languages, three widths, and both themes. Native search/navigation, keyboard language choice, persistence after reload, and newcomer navigation passed. Final Tamil/Malayalam navigation copy was checked again in 48 focused cases.
- Web, iOS, and Android Expo exports passed. Physical-device testing and native-speaker copy review remain outstanding.
- The gallery contains 124 fresh screenshots, including native-language previews and language selection.

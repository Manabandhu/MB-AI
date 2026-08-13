# Platform architecture

ManaBandhu is a multi-surface platform, not a phone-only application.

## Runtime surfaces

- Now: iOS and Android phones, tablets, foldables, mobile browsers, tablet browsers, and desktop web through Expo and React Native Web.
- Later: watchOS, Wear OS, Apple TV, Android TV, and other TV targets. These consume stable contracts and shared domain packages; they are not part of the current runtime build.

## System boundaries

- `frontend/universal`: adaptive Expo shell for native and web experiences.
- `frontend/future`: reserved watch and TV application shells.
- `backend`: Spring Boot modular monolith exposing authenticated REST and GraphQL plus the audited automation control plane.
- `packages/api-contracts`: canonical HTTP, GraphQL, and event schemas.
- `packages/design-system`: platform-neutral tokens and adaptive layout rules.
- `services`: extraction-ready AI, chat, notification, and analytics boundaries.
- `infra`: deployment and observability configuration.
- `.codex/skills`: executable maintenance knowledge for each governed module.

Begin as a modular monolith. Extract a service only when scaling, isolation, security, or deployment cadence justifies the operational cost.

## Cross-cutting requirements

- Supabase Auth is the identity provider; Spring validates user JWTs.
- Business APIs are contract-first and versioned.
- Every outbound notification respects user preference, consent, locale, quiet hours, and deduplication.
- AI output is untrusted until policy, authorization, privacy, moderation, and audit checks complete.
- Analytics events contain no message bodies, secrets, access tokens, or unnecessary personal data.
- Every production request carries correlation and trace identifiers.

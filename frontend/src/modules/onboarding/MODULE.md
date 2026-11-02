# Onboarding

The eight-step setup flow under `/onboarding/*` (goals, location, languages, interests, profile photo,
notifications, trust pledge, complete). Governed by the `manabandhu-foundation` skill.

| Path | Contents |
|---|---|
| `api.ts` | Onboarding config, progress, step save and completion (backend `/api/v1/onboarding/*`; signed-out previews stay on the device) |
| `screens/OnboardingScreen.tsx` | Shell: header, progress, docked actions; renders the current step view |
| `hooks/useOnboardingFlow.ts` | State, persistence, navigation, location detection |
| `utils/stepMeta.ts` | Step order, routes and helpers |
| `components/steps/` | One view per step (`STEP_VIEWS[meta.index - 1]`) |
| `styles.ts` | Palette-based styles shared by the shell and the steps |

Public API (`index.ts`): `getOnboardingProgress`, used by `auth` to route after sign-in.

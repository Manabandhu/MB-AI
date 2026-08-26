# ManaBandhu Design System

## 1. Brand Foundation

### Logo
- Primary logo asset: `assets/images/welcome/manabandhu-logo.jpg`
- Icon: `assets/images/icon.png`
- Splash icon: `assets/images/splash-icon.png`
- Android adaptive icon foreground: `assets/images/android-icon-foreground.png`
- Android adaptive icon background: `assets/images/android-icon-background.png`

### Brand Voice
- Simple, trustworthy, community-focused
- Clear primary actions
- Simple language and understandable labels
- Inclusive and respectful tone

## 2. Color System

### Light Theme
| Token | Value | Usage |
|---|---|---|
| `color.background` | `#faf8ff` | Page background |
| `color.ink` | `#131b2e` | Primary text, icons |
| `color.muted` | `#625f6e` | Secondary text, placeholders |
| `color.primary` | `#431ebe` | Primary actions, links, active states |
| `color.primarySoft` | `#e5deff` | Primary tinted surfaces |
| `color.surface` | `#ffffff` | Cards, sheets, inputs |
| `color.teal` | `#00696b` | Success indicators, positive actions |
| `color.border` | `#e2e8f0` | Dividers, input borders |
| `color.success` | `#1b873f` | Success states |
| `color.error` | `#ba1a1a` | Error states |
| `color.warning` | `#d97706` | Warning states |
| `color.info` | `#2563eb` | Informational banners |
| `color.overlay` | `rgba(19,27,46,0.48)` | Modal backdrop |
| `color.skeleton` | `#e5deff` | Loading shimmer |

### Dark Theme
| Token | Value | Usage |
|---|---|---|
| `darkColor.background` | `#0f1525` | Page background |
| `darkColor.ink` | `#f1f5ff` | Primary text, icons |
| `darkColor.muted` | `#9aa3b2` | Secondary text |
| `darkColor.primary` | `#a78bfa` | Primary actions |
| `darkColor.primarySoft` | `#2e245a` | Primary tinted surfaces |
| `darkColor.surface` | `#1a2138` | Cards, sheets |
| `darkColor.teal` | `#34d399` | Success indicators |
| `darkColor.border` | `#2a3348` | Dividers |
| `darkColor.success` | `#4ade80` | Success states |
| `darkColor.error` | `#fca5a5` | Error states |
| `darkColor.warning` | `#fbbf24` | Warning states |
| `darkColor.info` | `#60a5fa` | Informational banners |
| `darkColor.overlay` | `rgba(15,21,37,0.64)` | Modal backdrop |
| `darkColor.skeleton` | `#2e245a` | Loading shimmer |

### Color Rules
- Primary buttons: `color.primary` background, `color.surface` text
- Secondary buttons: `color.surface` background, `color.primary` border/text
- Destructive actions: `color.error` text or background
- Success feedback: `color.success` text or background
- Warning feedback: `color.warning` text or background
- Info feedback: `color.info` text or background
- All interactive elements must meet WCAG AA contrast ratios

## 3. Typography

### Type Scale
| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `typography.display` | 36 | 800 | 44 | -0.5 | Splash, hero headlines |
| `typography.h1` | 28 | 800 | 34 | -0.3 | Screen titles |
| `typography.h2` | 24 | 800 | 32 | -0.2 | Section titles |
| `typography.h3` | 20 | 800 | 28 | 0 | Card titles, subsections |
| `typography.h4` | 17 | 800 | 24 | 0 | List item titles |
| `typography.body` | 16 | 400 | 25 | 0 | Body text |
| `typography.bodyStrong` | 16 | 700 | 25 | 0 | Emphasized body |
| `typography.lead` | 18 | 400 | 28 | 0 | Lead paragraphs |
| `typography.caption` | 12 | 700 | 18 | 0.2 | Labels, metadata |
| `typography.overline` | 11 | 800 | 16 | 0.8 | Eyebrows, category tags |
| `typography.mono` | 14 | 500 | 20 | 0.2 | Code, addresses, IDs |

### Font Family
- Platform default: system font stack
- Numbers: tabular figures preferred for metrics and counts

## 4. Spacing

### Space Scale
| Token | Value | Usage |
|---|---|---|
| `space.x1` | 4 | Tight gaps, icon padding |
| `space.x2` | 8 | Small gaps, inline spacing |
| `space.x3` | 12 | Card padding, form gaps |
| `space.x4` | 16 | Standard screen padding |
| `space.x5` | 20 | Medium gaps |
| `space.x6` | 24 | Large gaps, section spacing |
| `space.x8` | 32 | Section padding, card gaps |
| `space.x10` | 40 | Large section spacing |
| `space.x12` | 48 | Hero spacing |
| `space.x16` | 64 | Splash, onboarding spacing |

### Layout Rules
- Mobile screens: `space.x4` horizontal padding
- Tablet screens: `space.x6` horizontal padding
- Desktop screens: `space.x8` horizontal padding, max content width `contentWidth.wide`
- Card internal padding: `space.x4`
- Card gaps: `space.x3` to `space.x6`
- Form field gaps: `space.x4`
- Section gaps: `space.x6` to `space.x8`

## 5. Radii

| Token | Value | Usage |
|---|---|---|
| `radius.control` | 12 | Buttons, inputs, chips |
| `radius.card` | 16 | Cards, list items |
| `radius.panel` | 24 | Large panels, bottom sheets |
| `radius.pill` | 999 | Pills, tabs, avatars |

## 6. Elevation / Shadows

| Token | Elevation | Usage |
|---|---|---|
| `shadow.sm` | 2 | Small cards, dropdowns |
| `shadow.md` | 4 | Cards, buttons |
| `shadow.lg` | 8 | Modals, bottom sheets |
| `shadow.xl` | 12 | Dialogs, alerts |

## 7. Motion

| Token | Duration | Usage |
|---|---|---|
| `duration.instant` | 0 | No animation |
| `duration.fast` | 120 | Micro-interactions |
| `duration.normal` | 220 | Standard transitions |
| `duration.slow` | 320 | Shared element transitions |
| `duration.slower` | 480 | Onboarding, splash |

### Motion Rules
- All animations must respect `accessibility.reducedMotion`
- Standard transitions: `duration.normal` with ease-in-out
- Press feedback: `duration.fast` scale/opacity
- Page transitions: `duration.slow` slide/fade

## 8. Iconography

### Icon Library
- Primary: `iconoir-react-native`
- Size scale: `xs` (16), `sm` (20), `md` (24), `lg` (32), `xl` (48)
- Stroke width: `thin` (1.5), `regular` (2.25), `bold` (3)

### Icon Rules
- Use semantic names from `AppIconName` union
- Primary color: `color.ink`
- Muted color: `color.muted`
- On primary surfaces: `color.surface`
- Touch target minimum: `accessibility.minTouchTarget` (44pt)
- Icon-only buttons must have `accessibilityLabel`

## 9. Responsive / Adaptive Layout

### Breakpoints
| Class | Min Width | Columns | Max Content Width |
|---|---|---|---|
| `compact` | 0 | 1 | `contentWidth.compact` |
| `medium` | 600 | 2 | `contentWidth.medium` |
| `expanded` | 1024 | 3 | `contentWidth.expanded` |
| `wide` | 1440 | 3+ | `contentWidth.wide` |

### Adaptive Rules
- Single column on compact phones
- 2 columns on tablets / medium screens
- 3 columns on desktop / wide screens
- Foldable devices: treat inner/outer displays via window class
- Safe area insets always respected via `react-native-safe-area-context`
- Keyboard-aware: scroll to focused input on form screens

## 10. Accessibility

### Rules
- Minimum touch target: 44x44pt
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text
- All interactive elements need `accessibilityRole` and `accessibilityLabel`
- Focus ring width: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Support screen readers for all content
- Color is not the only indicator of state

## 11. Component Inventory

### Primitives
- `AppButton` - primary/secondary/ghost button with optional icon and route
- `AppIcon` - semantic icon wrapper
- `Avatar` - user avatar with fallback initials
- `Badge` - status badge, count badge, category badge
- `Banner` - info/warning/error banner
- `BottomSheet` - slide-up panel for actions/filters

### Layout
- `ScreenShell` - screen wrapper with safe area, scroll, padding
- `SectionHeader` - eyebrow + title + optional action
- `TabBar` - bottom tab navigation
- `TopBar` - header with back, title, actions

### Data Display
- `CatalogScreen` - metric cards + action buttons + item cards grid
- `ListScreen` - scrollable list with section headers
- `DetailScreen` - hero image + content + action buttons
- `Card` - generic card component
- `MetricCard` - metric display for dashboard/catalog screens
- `FeedItem` - compact list item with icon, title, body, meta

### Input
- `FormScreen` - form wrapper with validation states
- `SearchBar` - search input with clear and filter
- `FilterBar` - horizontal filter chips
- `Input` - text input wrapper
- `TextArea` - multi-line input
- `Select` - picker/select input
- `Checkbox` - checkbox input
- `RadioGroup` - radio group input

### Feedback
- `LoadingState` - skeleton, spinner, progress
- `EmptyState` - illustration + title + body + action
- `ErrorState` - error icon + title + body + retry action
- `SuccessState` - success icon + title + body + action
- `Toast` - transient feedback message

### Overlays
- `Modal` - centered modal dialog
- `BottomSheet` - bottom sheet with drag handle
- `ActionSheet` - iOS-style action sheet

## 12. State Patterns

Every screen must handle:
- **Loading**: skeleton or spinner while data loads
- **Empty**: illustration, title, body, primary action when no data
- **Error**: error icon, title, body, retry action on failure
- **Success**: confirmation after actions like create/post/book
- **Offline**: banner indicating offline mode, cached data shown
- **Permission**: guidance when permission is missing (location, notifications, camera)

## 13. Navigation Rules

### Route Structure
- `/` - Splash
- `/welcome` - Welcome flow
- `/sign-in`, `/sign-up`, `/forgot-password` - Auth
- `/home` - Home shell
- `/explore` - Explore shell
- `/search` - Global search
- `/saved` - Saved items
- `/notifications` - Notifications inbox
- `/profile` - User profile
- `/settings` - Settings
- `/onboarding/*` - Onboarding steps
- Module routes: `/{module}`, `/{module}/search`, `/{module}/map`, `/{module}/filters`, `/{module}/saved`, `/{module}/create-*`, `/{module}/[id]`, `/{module}/[id]/edit`, etc.

### Tab Navigation
- Home, Explore, Search, Saved, Profile (foundation shell)

### Back Navigation
- Always show back button on pushed screens
- Modal screens dismiss on back
- Deep links navigate to module home if intermediate state missing

## 14. Assets & Images

### Required Assets
- `assets/images/welcome/manabandhu-logo.jpg` - primary logo
- `assets/images/welcome/community-services.jpg` - welcome image 1
- `assets/images/welcome/trusted-neighborhood.jpg` - welcome image 2
- `assets/images/icon.png` - app icon
- `assets/images/splash-icon.png` - splash screen icon
- `assets/images/android-icon-foreground.png` - Android adaptive icon
- `assets/images/android-icon-background.png` - Android adaptive icon bg
- Placeholder avatars: generated initials-based avatars
- Category icons: `iconoir-react-native` semantic icons

### Image Rules
- Use `expo-image` for optimized caching
- Remote images must have fallback placeholders
- Aspect ratio locked for catalog cards
- Blurhash placeholders for network images

## 15. Implementation Notes for Expo React Native

### File Organization
- `frontend/src/app/` - Expo Router route files (thin wrappers)
- `frontend/src/modules/` - Business capability modules
- `frontend/src/modules/shared/` - Shared components and UI
- `frontend/src/platform/` - Adaptive layout utilities
- `frontend/src/lib/` - API clients, env, Supabase
- `packages/design-system/` - Cross-platform tokens

### Patterns
- Route files delegate to module screens
- Modules may import `src/lib`, `src/platform`, design-system, shared UI
- Avoid importing another module's internals; expose public API via `index.ts`
- Use `useQuery` for server state, `useState` for local UI state
- Forms: `react-hook-form` + `zod` + `@hookform/resolvers`
- Styling: `StyleSheet` + Tailwind utilities via `uniwind`
- Animations: `@legendapp/motion`

### Data Patterns
- Demo data: inline fixtures when API is not yet ready
- API layer: `apiFetch` in `frontend/src/lib/api.ts`
- Auth: Supabase client in `frontend/src/lib/supabase.ts`
- Error boundaries: wrap module roots for graceful failures

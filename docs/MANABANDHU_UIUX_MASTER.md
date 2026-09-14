# ManaBandhu: Unified UI/UX Architecture & Screen Master

> **Product Ecosystem**: ManaBandhu (మన బంధు / Community Companion)  
> **Stitch Project ID**: `9663298292574415459`  
> **Unified Design System**: ManaBandhu Modern Vibrant (`assets/18105029676315711182`)  
> **Brand Philosophy**: One Brand → One Design System → Consistent Components → Organized Modules → Complete Mobile Experience → Complete Responsive Web Experience.

---

## 1. Brand & Design System Foundation

### 1.1 Brand Identity
ManaBandhu is the premier community assistance and empowerment ecosystem connecting the Telugu and South Asian diaspora across Texas (Austin, Dallas-Fort Worth, Houston, San Antonio) for housing (rooms), intercity carpools (rides), peer-to-peer commerce (marketplace), professional tech referrals (jobs), community events, and cultural connection.

### 1.2 Unified Design Tokens (`@manabandhu/design-system`)

| Token | Light Value | Dark Value | Semantic Purpose |
|---|---|---|---|
| `color.primary` | `#431ebe` | `#a78bfa` | Primary brand royal indigo/violet; main CTA buttons, active state indicators |
| `color.primaryContainer` | `#5b3fd6` | `#6d48d7` | Elevated primary containers, active pills, step indicators |
| `color.primarySoft` | `#e5deff` | `#2e245a` | Subtle primary tinted chip fills, hover accents |
| `color.teal` | `#00696b` | `#34d399` | Trust & verification badges, security guarantees, positive status chips |
| `color.warm` | `#ff7e33` | `#ff955e` | Warm sunrise orange accent; cultural celebrations, active alerts, urgent notices |
| `color.background` | `#faf8ff` / `#f6f6ff` | `#0f1525` | Soft pristine pearl canvas; reduces eye fatigue, enhances card contrast |
| `color.surface` | `#ffffff` | `#1a2138` | Crisp elevated card containers, sheets, popovers, input surfaces |
| `color.ink` | `#131b2e` | `#f1f5ff` | High-contrast obsidian typography, icons, headings |
| `color.muted` | `#625f6e` | `#9aa3b2` | Refined slate secondary body copy, placeholders, timestamps |
| `color.border` | `#e2e8f0` | `#2a3348` | Subtle hairline dividers, input borders, inactive card outlines |
| `color.success` | `#1b873f` | `#4ade80` | Confirmed bookings, verified checkmarks |
| `color.error` | `#ba1a1a` | `#fca5a5` | Destructive actions, validation errors, moderation flags |
| `color.warning` | `#d97706` | `#fbbf24` | Review notices, pending statuses |

### 1.3 Typography Scale
- **Headlines & Display**: Plus Jakarta Sans (`800` Extrabold / `700` Bold) with tight tracking (`-0.02em` on titles > 20px) for punchy, modern readability.
- **Body & Controls**: Inter (`400` Regular, `600` Semibold, `700` Bold), 16px baseline with generous 1.5 line height (`24px` / `25px`).
- **Labels & Micro-copy**: Public Sans / Inter (`11px` - `12px`, `700` Bold) for tags, badges, and metro location chips.

### 1.4 Shape, Elevation & Grid
- **Radii**: `12px` (control/buttons/inputs), `16px` (cards/listings), `24px` (modals/bottom sheets), `999px` (pills/badges).
- **Elevation**: Ambient diffused soft shadows (`0px 4px 12px -2px rgba(19, 27, 46, 0.06)`), avoiding harsh black drop-shadows.
- **Mobile Grid**: 4-column fluid layout with `16px` screen margin (`space.x4`) and `12px` gutter (`space.x3`).
- **Desktop Grid**: 12-column responsive layout with `32px` - `48px` side padding, max container width `1280px` / `1320px`.

---

## 2. Mobile Application: Complete Module-by-Module Experience

Every module adheres to the complete user journey:  
**List → Search/Filter → Details → Create/Post → Edit → Action/Confirmation → Success/Empty State**

```
ManaBandhu Mobile Architecture
├── 1. Authentication
│   ├── Sign In (`6df7f7673dd942b69ae807cc2220213b`)
│   ├── Sign Up (`8599b392d0834ce1af1e7c0becb776e1`)
│   └── Multi-Method OTP Verification (`/otp-verification`)
├── 2. Onboarding
│   ├── Splash (`6d3ab1cb367740c8a71cb6a58e7f6f65`)
│   ├── Welcome & Culture (`e8c095a7b430406e89177e71154883a9`)
│   ├── Trust & Verification Step 2 (`51896b4c8ece430fb8c9b2b3bfd98ba7`)
│   ├── Preferences & Neighborhoods Step 3 (`f75e484d9649411095a34c570a73278b`)
│   └── Warm Community Introduction (`829b832c9f25441a94c43291bd5af791`)
├── 3. Home & App Shell
│   ├── Personalized Home Feed (`dec4b405697d46dbb64d8e3967486d12`)
│   ├── Explore & Services Catalog (`92652418ff504034a50fbc7603645af4`)
│   ├── Global Search & Filters (`/search`)
│   └── Saved Items Across Modules (`/saved`)
├── 4. Rooms & Housing
│   ├── Rooms Discovery & Filtered Search (`dd30368e87d84025bde72fb593f0a6b4`)
│   ├── Room Details & Roommate Compatibility (`ef3f44e5cb5c477ea7fffd1fd928009b`)
│   ├── Post Room Listing & Verification (`7928f56130f54ca299a44b40fade735c`)
│   └── Room Inquiry & Video Walkthrough Booking (`/rooms/[roomId]/inquiry`)
├── 5. Rides & Carpooling
│   ├── Rides Discovery & City Commutes (`e5b52aed5241453789ec12c4df47d9c2`)
│   ├── Ride Details & Seat Booking (`23a172b67959467daa3117b84dda4dd8`)
│   └── Offer / Post a Ride & Carpool (`eda901149b7c4f2898d8c9b3c91bc7e7`)
├── 6. Marketplace
│   ├── Telugu & Indian Marketplace Discovery (`35c1d69227a64f32bef955ec45c548b1`)
│   ├── Item Details & Daylight Pickup Guarantee (`6f3b114660bf4ef6b8b27501d4514326`)
│   └── Sell / List an Item Form (`343d167461d049a2928f0a38dd6dfbef`)
├── 7. Community & Events
│   ├── Community Discussion Feed (`478f613abe2b43588cc9bf4de319905f`)
│   ├── Discussion Thread & Post Details (`1069f944595b40169bea28d225b52605`)
│   ├── Desi Community Events & Meetups (`f3ea9ea291424d759cf85d9786cc8bcc`)
│   └── Event Details & RSVP (`203a0524f000487e9b1384e8d484e701`)
├── 8. Jobs & Referrals
│   ├── Tech Referrals & Jobs Discovery (`6a09e96bf13b46e08ba1095d8dbb294d`)
│   ├── Job Details & Referral Application (`fb5972ed58e147c6bfe599525567de6f`)
│   ├── Referral Details & Intro Request (`3fd0de404d5f443da6b4c4cdb7e4ce76`)
│   └── Skill Exchange & Mentorship (`84e1cfd6b5774d599713132163437272`)
├── 9. Messages & Chat
│   ├── Messages & Inquiries Inbox (`9b921d7e53874c6b92e77cb3d9c03969`)
│   └── Direct Conversation & Offer Negotiation (`097082df556f4c7a99749df670f755ff`)
├── 10. Notifications
│   └── Notifications Center & Activity Feed (`bd7e876fb85a465b9ec3ccd9d4c779a4`)
├── 11. Profile & Settings
│   ├── Mobile User Profile & Badges (`e9a6eb4d546d4f27b3cd21128687cede`)
│   └── Settings & Preferences (`bb2258972daa43188da68da52674c020`)
└── 12. Admin & Safety
    ├── Admin & Content Moderation Console (`5510db36116146e88343b0e113de2130`)
    └── Community Safety Charter & Reporting (`/safety`)
```

### Screen Details & Stitch Artifact Mapping

| Screen Title | Module | Stitch Screen ID | Route | Device | Primary Role |
|---|---|---|---|---|---|
| **Splash Screen** | Foundation | `6d3ab1cb367740c8a71cb6a58e7f6f65` | `/` | Mobile | Brand emblem, instant initialization |
| **Welcome & Onboarding** | Foundation | `e8c095a7b430406e89177e71154883a9` | `/welcome` | Mobile | Value proposition, zero-brokerage charter |
| **Trust & Verification (Step 2)** | Foundation | `51896b4c8ece430fb8c9b2b3bfd98ba7` | `/onboarding/trust-and-safety` | Mobile | Work email + ID upload, verified badge |
| **Preferences & Neighborhoods (Step 3)** | Foundation | `f75e484d9649411095a34c570a73278b` | `/onboarding/preferences` | Mobile | Metro selector, diet/lifestyle preferences |
| **Warm Community Onboarding** | Foundation | `829b832c9f25441a94c43291bd5af791` | `/onboarding/complete` | Mobile | Welcome completion, community pledge |
| **Sign In** | Auth | `6df7f7673dd942b69ae807cc2220213b` | `/sign-in` | Mobile | Email/Phone + password login |
| **Sign Up** | Auth | `8599b392d0834ce1af1e7c0becb776e1` | `/sign-up` | Mobile | Registration with employer/student verification |
| **Home Feed** | Foundation | `dec4b405697d46dbb64d8e3967486d12` | `/home` | Mobile | Quick actions, personalized activity, urgent rides/rooms |
| **Explore Services** | Foundation | `92652418ff504034a50fbc7603645af4` | `/explore` | Mobile | Category discovery grid, curated services |
| **Rooms Discovery** | Rooms | `dd30368e87d84025bde72fb593f0a6b4` | `/rooms` | Mobile | Filtered search, 2B2B private rooms, price sorting |
| **Room Details** | Rooms | `ef3f44e5cb5c477ea7fffd1fd928009b` | `/rooms/[roomId]` | Mobile | Photos, amenities, vegetarian kitchen tag, host info |
| **Post Room Listing** | Rooms | `7928f56130f54ca299a44b40fade735c` | `/rooms/create-listing` | Mobile | Multi-step wizard: rent, utilities, roommate preferences |
| **Rides & Carpool Discovery** | Rides | `e5b52aed5241453789ec12c4df47d9c2` | `/rides` | Mobile | Intercity routes (DFW ↔ Austin ↔ Houston), seats |
| **Ride Details & Booking** | Rides | `23a172b67959467daa3117b84dda4dd8` | `/rides/[rideId]` | Mobile | Route timeline, Buc-ee's stops, seat reservation |
| **Offer a Ride & Carpool** | Rides | `eda901149b7c4f2898d8c9b3c91bc7e7` | `/rides/offer` | Mobile | Route planner, seat count, fair gas split, EV badge |
| **Marketplace Discovery** | Marketplace | `35c1d69227a64f32bef955ec45c548b1` | `/marketplace` | Mobile | 2-col product cards, verified seller badges, tags |
| **Marketplace Item Details** | Marketplace | `6f3b114660bf4ef6b8b27501d4514326` | `/marketplace/[id]` | Mobile | Preethi mixer grinder photo, specs, Patel Bros pickup |
| **Sell / List an Item** | Marketplace | `343d167461d049a2928f0a38dd6dfbef` | `/marketplace/sell` | Mobile | Photo uploader, condition, price/free toggle, daylight pickup |
| **Community Feed** | Community | `478f613abe2b43588cc9bf4de319905f` | `/community` | Mobile | Telugu diaspora posts, questions, recommendations |
| **Post Discussion Thread** | Community | `1069f944595b40169bea28d225b52605` | `/community/posts/[id]`| Mobile | Nested comments, upvotes, verified member tags |
| **Events Discovery** | Events | `f3ea9ea291424d759cf85d9786cc8bcc` | `/events` | Mobile | Diwali meetups, sports tournaments, temple pujas |
| **Event Details & RSVP** | Events | `203a0524f000487e9b1384e8d484e701` | `/events/[id]` | Mobile | Venue map, RSVP counter, attendee list |
| **Jobs & Tech Discovery** | Jobs | `6a09e96bf13b46e08ba1095d8dbb294d` | `/jobs` | Mobile | Tech referrals, H-1B friendly companies, roles |
| **Job Details & Application** | Jobs | `fb5972ed58e147c6bfe599525567de6f` | `/jobs/[id]` | Mobile | Responsibilities, salary band, referral request |
| **Referral Details & Intro** | Referrals | `3fd0de404d5f443da6b4c4cdb7e4ce76` | `/referrals/[id]` | Mobile | Employee intro request, LinkedIn verified profile |
| **Messages & Inquiries Inbox** | Chat | `9b921d7e53874c6b92e77cb3d9c03969` | `/chat` | Mobile | Filtered threads (Rooms, Rides, Market, Community) |
| **Direct Conversation Thread** | Chat | `097082df556f4c7a99749df670f755ff` | `/chat/[id]` | Mobile | Real-time chat, counteroffer widget, media sharing |
| **Notifications Center** | Notifications | `bd7e876fb85a465b9ec3ccd9d4c779a4` | `/notifications` | Mobile | Grouped chronological alerts, actionable accept/decline |
| **User Profile & Badges** | Profile | `e9a6eb4d546d4f27b3cd21128687cede` | `/profile` | Mobile | Reputation score, verification tier, user listings |
| **Settings & Preferences** | Settings | `bb2258972daa43188da68da52674c020` | `/settings` | Mobile | Account, language (Telugu/English), safety, payments |
| **Admin Moderation Console** | Admin | `5510db36116146e88343b0e113de2130` | `/admin` | Mobile | Pending queue, broker detection, safety delisting |

---

## 3. Responsive Web Application Experience

The Web Application shares identical branding, design tokens, visual vocabulary, and component styles with the mobile application while adapting fluidly to large screen real estate (1024px - 1440px) using multi-column layouts, sticky sidebar filters, and inline preview panels.

```
ManaBandhu Web Architecture
├── 1. Global Navigation Shell (Sticky Top Header + Brand Wordmark + Metro Switcher)
├── 2. Desktop Home & Dashboard (`58c5ba58d25943cead0bb0fa370a3532`)
├── 3. Desktop Explore Catalog (`ce49b04a52d14203a71588d409b7d258`)
├── 4. Desktop Rooms & Housing Search (`aa722edb47454c42989f05bb69052ff6`)
│   └── Split layout: Interactive Metro Map on left, 2-col Room listings on right
├── 5. Desktop Rides & Intercity Carpool Hub (`9d734ded7b884d29af55a75bf91bec82`)
│   └── Split layout: Carpool listings on left, Interactive I-35 route map & Buc-ee's rest stops on right
├── 6. Desktop Community Hub (`3bca34efb3c64910bdc42f0dabd78dfb`)
│   └── 3-Column layout: Topics & groups sidebar, central thread feed, upcoming events calendar
├── 7. Desktop Chat & Inquiries (`8789622e1be845d3bdab21d1f9872b67`)
│   └── Master-detail view: Left conversation list, right active chat thread with inline booking widget
├── 8. Desktop User Profile (`8326bed2d3924effa53eb67385434f09`)
│   └── Multi-tab profile: About, Verified Credentials, Active Listings, Reviews, Saved Searches
└── 9. Desktop Admin & Moderation Center (Web Console)
    └── Data table view: Moderation queues, fraud telemetry, member verification reviews
```

### Desktop Web Layout Reflow Specifications

| Component / Section | Mobile Behavior (<768px) | Tablet Behavior (768px–1023px) | Desktop Web Behavior (≥1024px) |
|---|---|---|---|
| **App Navigation** | Bottom 5-Tab Bar + Sticky Header | Top Navigation Bar with collapsed search | Global Sticky Header + Wordmark + Metro selector + Full Links + Profile Pill |
| **Rooms / Housing** | 1-Column scroll with modal map | 2-Column grid with toggleable map | Split Screen: 45% sticky interactive map, 55% infinite scroll listing feed with quick preview |
| **Rideshare** | Vertical cards + modal booking | 2-Column cards with route summary | 2-Column Layout: Left ride feed with driver badges, Right interactive highway corridor guide |
| **Marketplace** | 2-Column product cards | 3-Column product cards | 4-Column responsive grid with 260px sticky filter sidebar |
| **Chat & Inquiries** | Push navigation: List → Thread | Split view (30% list, 70% thread) | Full master-detail suite with contextual listing header and instant transaction actions |
| **Admin Console** | Scrollable review cards with action pills | Tabbed queue layout | Full-screen data table with filters, quick preview drawer, and multi-select batch actions |

---

## 4. Shared Components, Icons, Illustrations & Design Tokens

### 4.1 Reusable UI Components
- **`AppButton`**: Supports `solid` (Primary #431ebe), `secondary` (Teal #00696b), `outline`, `ghost`, and `destructive` (Red #ba1a1a). All maintain 44px min touch target and 12px border radius.
- **`AppCard`**: Crisp pure white `#ffffff` surface, `1px solid #e2e8f0` border, `16px` border radius, ambient diffused elevation.
- **`StatusBadge`**: Pill container with leading micro-icon for Verified Bandhu (`#00696b` / teal soft fill), Active Ride (`#1b873f`), Pending (`#d97706`), Urgent (`#ff7e33`).
- **`SearchBar`**: Unified search input with instant clear, voice input shortcut, and sticky filter trigger pill.
- **`EmptyState`**: Curated illustrated empty states with contextual reassurance, primary action button, and clear next steps.
- **`ErrorState` & `LoadingState`**: Branded skeleton loaders using `#e5deff` shimmer and retryable error cards.

### 4.2 Brand Assets in Stitch
- **Brand Emblem Logo**: `78e1464696da4fd2938ebdda52183ddb` (ManaBandhu circular intertwined hands emblem in Royal Indigo & Sunrise Orange).
- **Hero Community Illustration**: `aea985be38e6404b88f3e3148a0e8ae7` (Modern 3D/flat hybrid vector representing housing, carpool, tech referrals, and diverse smiling people).
- **Marketplace Product Asset**: `d44e8c044c084fa29c75cea6c6b3ff29` (Preethi Eco Twin Mixer Grinder with stainless steel jars on clean kitchen countertop).

---

## 5. Consistency & Quality Assurance Audit

We performed an audit across all 28 screens in the ManaBandhu product ecosystem:

1. **Color Standardization**:
   - Resolved the color divergence in Marketplace discovery and item detail screens; converted all elements to the unified ManaBandhu palette (`#431ebe` Royal Indigo, `#00696b` Teal, `#ff7e33` Sunrise Orange).
2. **Typography Consistency**:
   - Verified that all screen headlines utilize Plus Jakarta Sans with bold weights, and all body text, specs, and form inputs utilize Inter.
3. **Button & Interaction Hierarchy**:
   - Every primary call to action (Publish, Book, Reserve, Sign In, RSVP) uses the standardized `#431ebe` button styling with rounded corners (`12px` / `0.75rem`) and bold typography.
   - Secondary actions consistently use outlined or teal-tinted containers.
4. **Navigation Flow Completeness**:
   - Ensured no dead-ends exist in any module.
   - Bottom navigation bars consistently present 5 core destinations across mobile views.
   - Top headers consistently provide intuitive back navigation, contextual titles, and secondary utility actions.
5. **Accessibility**:
   - All text meets or exceeds WCAG AA contrast ratio standards against `#ffffff` and `#faf8ff` backgrounds.
   - Interactive touch targets strictly enforce the 44px minimum sizing rule.

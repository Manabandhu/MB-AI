# ManaBandhu Navigation Map

## 1. Route Tree

```
/ (Splash)
├── /welcome (Welcome Flow)
├── /sign-in (Sign In)
├── /sign-up (Sign Up)
├── /forgot-password (Forgot Password)
├── /phone-login (Phone Login)
├── /email-login (Email Login)
├── /otp-verification (OTP Verification)
├── /reset-password (Reset Password)
├── /accept-terms (Accept Terms once, after sign-in when the account has no recorded consent; sign-in required)
├── /choose-login-method (Choose Login Method)
├── /home (Home Shell)
│   ├── /rooms (Rooms Home)
│   ├── /rides (Rides Home)
│   ├── /community (Community Home)
│   └── /notifications (Notifications Inbox)
│       ├── /notifications/[id] (Notification Detail → "Open" goes to its in-app route)
│       └── /notifications/settings (Notification Settings, sign-in required)
├── /explore (Explore Shell)
├── /search (Global Search)
├── /saved (Saved Items)
├── /profile (Profile)
│   └── /settings (Settings)
│       └── /settings/account (Account & data: sign-in details, export, delete; sign-in required)
├── /terms (Terms of Service, public)
├── /privacy (Privacy Policy, public)
├── /onboarding/*
│   ├── /onboarding/about (About You)
│   ├── /onboarding/photo (Profile Photo)
│   ├── /onboarding/reason (What Brings You Here)
│   ├── /onboarding/location (Location)
│   ├── /onboarding/languages (Languages)
│   ├── /onboarding/interests (Interests)
│   ├── /onboarding/notifications (Notifications)
│   ├── /onboarding/trust-and-safety (Trust & Safety)
│   └── /onboarding/complete (Complete)
├── /rooms/*
│   ├── /rooms/search
│   ├── /rooms/map (rooms without coordinates are listed, never pinned)
│   ├── /rooms/filters
│   ├── /rooms/saved (sign-in required)
│   ├── /rooms/my-listings (sign-in required; ?notice= shows the result of a save)
│   ├── /rooms/create-listing (sign-in required → /rooms/my-listings)
│   └── /rooms/[roomId] (owner sees Edit + status actions; others Save, Contact host, Quick hello, Report)
│       ├── /rooms/[roomId]/edit (sign-in required, owner only)
│       └── /rooms/[roomId]/inquiry (sign-in required → /chat/[conversationId])
├── /rides/*
│   ├── /rides/search
│   ├── /rides/map
│   ├── /rides/filters
│   ├── /rides/offer (sign-in required)
│   ├── /rides/request (redirect → /rides/search, keeps from/to)
│   ├── /rides/saved (sign-in required)
│   ├── /rides/mine (sign-in required; tabs Driving | Riding, ?tab=riding; upcoming only)
│   ├── /rides/history (sign-in required)
│   └── /rides/[rideId] (sticky bar: Book seats for riders; Manage for the driver; Open chat / Rate for members)
│       ├── /rides/[rideId]/manage (sign-in required, driver only; tabs Overview | Requests | Riders, ?tab=)
│       ├── /rides/[rideId]/seat-requests (redirect → manage?tab=requests)
│       ├── /rides/[rideId]/participants (redirect → manage?tab=riders)
│       └── /rides/[rideId]/rate (after the ride is completed)
├── /community/*
│   ├── /community/discover
│   ├── /community/joined
│   ├── /community/[communityId]
│   │   └── /community/[communityId]/details
│   ├── /community/create-post
│   └── /community/posts/[postId]
├── /chat/*
│   ├── /chat/new
│   ├── /chat/[conversationId]
│   │   └── /chat/[conversationId]/info
│   └── /chat/[conversationId]/details
├── /events/*
│   ├── /events/search
│   ├── /events/[eventId]
│   │   └── /events/[eventId]/details
│   ├── /events/create
│   ├── /events/saved
│   └── /events/mine
├── /expenses/*
│   ├── /expenses/groups
│   ├── /expenses/groups/[groupId]
│   │   └── /expenses/groups/[groupId]/details
│   ├── /expenses/add
│   ├── /expenses/balances
│   └── /expenses/settlements
├── /immigration/*
│   ├── /immigration/resources
│   ├── /immigration/guides
│   ├── /immigration/checklists
│   ├── /immigration/faq
│   ├── /immigration/questions
│   ├── /immigration/uscis
│   ├── /immigration/news
│   ├── /immigration/saved
│   └── /immigration/resources/[resourceId]
├── /jobs/*
│   ├── /jobs/search
│   ├── /jobs/filters
│   ├── /jobs/saved
│   ├── /jobs/[jobId]
│   │   └── /jobs/[jobId]/details
│   └── /jobs/post
├── /marketplace/*
│   ├── /marketplace/search
│   ├── /marketplace/categories
│   ├── /marketplace/[listingId]
│   │   └── /marketplace/[listingId]/edit
│   ├── /marketplace/sell
│   ├── /marketplace/mine
│   └── /marketplace/saved
├── /referrals/*
│   ├── /referrals/request
│   ├── /referrals/offer
│   ├── /referrals/[referralId]
│   │   └── /referrals/[referralId]/details
│   └── /referrals/mine
├── /safety/*
│   ├── /safety/reports
│   ├── /safety/blocked-users
│   └── /safety/trusted-contacts
├── /utilities/*
│   ├── /utilities/packages
│   ├── /utilities/nearby
│   └── /utilities/emergency
└── /assistant/*
    ├── /assistant/history
    └── /assistant/citations
```

## 2. Tab Bar (Shell Navigation)

| Tab | Route | Icon | Active Icon | Label |
|---|---|---|---|---|
| Home | `/home` | home | home | Home |
| Explore | `/explore` | compass | compass | Explore |
| Search | `/search` | search | search | Search |
| Saved | `/saved` | bookmark | bookmark | Saved |
| Profile | `/profile` | user | user | Profile |

## 3. Module Quick Actions (Home Shell)

| Module | Route | Icon | Label |
|---|---|---|---|
| Rooms | `/rooms` | bed | Find a Room |
| Rides | `/rides` | car | Offer a Ride |
| Community | `/community` | community | Ask a Question |
| Jobs | `/jobs` | briefcase | Find a Job |
| Chat | `/chat` | message | Chat |
| Events | `/events` | calendar | Events |
| Marketplace | `/marketplace` | marketplace | Buy & Sell |
| Expenses | `/expenses` | wallet | Expenses |
| Immigration | `/immigration` | book | Immigration |
| Utilities | `/utilities` | wrench | Utilities |
| Safety | `/safety` | shield | Safety |
| Referrals | `/referrals` | help | Referrals |

## 4. Back Navigation Rules

- Pushed screens: show back button, pop to previous
- Modal screens: dismiss on back, show close button
- Tabs: switch tab, do not push
- Deep links: if intermediate state missing, navigate to module home

## 5. Auth Flow

```
Splash → Welcome → Sign In/Up → Onboarding → Home
                    ↓
              Forgot Password → Reset Password → Sign In
                    ↓
              Phone Login → OTP Verification → Home
                    ↓
              Choose Login Method → Phone/Email Login → Home
```

## 6. Module Navigation Patterns

### Rooms
- Home → Search → Filters → Map → Saved → My Listings → Create Listing
- Any list → Details → Edit Listing

### Rides
- Home (search, filter chips, list/map) → Ride details → Book seats → Your booking (chat, cancel) → My rides (Riding tab) → Rate after completion
- Home → Offer a ride → Manage (Overview: start/complete, seats and price, repeat, danger zone | Requests | Riders)
- Header: My rides, Saved, History; global Search → `/rides/search?from=&to=`; Repeat trip from Manage, My rides, History
- Any list → Details → Manage (Requests, Riders tabs) → Rate

### Community
- Home → Discover → Joined → Details → Create Post → Post Details

### Chat
- List → New Chat → Conversation → Conversation Info

### Admin
- Dashboard → Users → User Details (`/admin/users/[userId]`) → Reports → Report Details (`/admin/reports/[reportId]`) →
  Rooms/Rides/Community/Jobs/Events Moderation → Audit Log → Automations (super admin only)
- Every admin route shows "Not authorized" unless the signed token carries ADMIN or SUPER_ADMIN (automations: SUPER_ADMIN).

### Events
- Home → Search → Details → Create → Saved → My Events

### Expenses
- Home → Groups → Group Details → Add Expense → Balances → Settlements

### Immigration
- Home → Resources → Guides → Checklists → FAQ → Q&A → USCIS → News → Saved → Resource Detail

### Jobs
- Home → Search → Filters → Saved → Details → Post

### Marketplace
- Home → Search → Categories → Details → Sell → Saved

### Referrals
- Home → Request → Offer → Details → Mine

### Safety
- Center → Reports → Blocked Users → Trusted Contacts

### Utilities
- Home → Packages → Nearby → Emergency

### AI Assistant
- Assistant → History → Citations

## 7. Deep Links

| Deep Link | Route | Notes |
|---|---|---|
| `manabandhu://` | `/` | App launch |
| `manabandhu://welcome` | `/welcome` | Welcome flow |
| `manabandhu://home` | `/home` | Home shell |
| `manabandhu://rooms` | `/rooms` | Rooms home |
| `manabandhu://rides` | `/rides` | Rides home |
| `manabandhu://community` | `/community` | Community home |
| `manabandhu://chat` | `/chat` | Chat list |
| `manabandhu://notifications` | `/notifications` | Notifications inbox |
| Push tap | `data.route` (in-app path) or `/notifications/{id}` | Opens the related screen; external URLs are ignored |
| `manabandhu://profile` | `/profile` | User profile |
| `manabandhu://admin` | `/admin` | Admin dashboard |

## 8. Permission Gates

| Screen | Permission | Action if Missing |
|---|---|---|
| /rooms/map | Location (only for the GPS button) | Alert, then centre on the selected city |
| /rides/map | Location | Show permission banner + fallback list |
| /utilities/nearby | Location | Show permission banner + fallback list |
| /notifications/settings | Push Notifications | Asked only when the member turns push on; a refusal shows how to allow it in phone settings |
| /onboarding/notifications | Push Notifications | Asked after the member picks at least one alert; refusing continues onboarding |
| /assistant | Microphone (optional) | Disable voice input, show text-only mode |

## 9. Offline Behavior

| Screen | Offline Behavior |
|---|---|
| All catalog/list screens | Show cached data with offline banner |
| All form screens | Disable submit, show offline banner |
| All map screens | Show cached map tiles with offline banner |
| Chat | Show cached messages, queue new messages |
| Assistant | Show cached conversation, disable new queries |
| Auth | Disable login, show offline banner |

## 10. Responsive Behavior Rules

### Mobile (< 600px)
- Single column layout
- Full-width cards
- Bottom tab bar visible
- Bottom sheets take full width
- Modals centered with max width 90%

### Tablet (600px - 1023px)
- 2-column grid for cards
- Side tab bar or persistent header nav
- Bottom sheets with max width 640px
- Modals centered with max width 640px

### Desktop (>= 1024px)
- 3-column grid for cards
- Persistent sidebar navigation
- Bottom sheets with max width 800px
- Modals centered with max width 640px
- Max content width 1320px

### Foldable
- Inner display: treat as tablet
- Outer display: treat as phone
- Fold state awareness via window dimensions
- Content reflows seamlessly

## 11. Component Usage by Screen Type

| Screen Type | Primary Components |
|---|---|
| Shell | ScreenShell, SectionHeader, TabBar, TopBar |
| Catalog | CatalogScreen, MetricCard, Card, AppButton, SearchBar |
| List | ListScreen, SectionHeader, Card, AppButton, FilterBar |
| Detail | DetailScreen, ImageGallery, SectionHeader, AppButton, ListScreen |
| Form | FormScreen, Input, TextArea, Select, AppButton, ProgressBar |
| Map | MapScreen, MapView, MapPin, Card, SearchBar, FilterBar |
| Filter | FilterScreen, RangeSlider, CheckboxGroup, AppButton |
| Auth | ScreenShell, FormScreen, Input, AppButton, Text, Link |
| Onboarding | ScreenShell, FormScreen, ProgressBar, AppButton |
| Admin | ScreenShell, MetricCard, ListScreen, AppButton, Modal, SwipeAction |
| Chat | ScreenShell, MessageBubble, Input, AppButton, Avatar |
| Settings | ScreenShell, ListScreen, AppButton, Modal, Toggle |

## 12. State Handling by Screen Type

| State | Catalog | List | Detail | Form | Map | Auth |
|---|---|---|---|---|---|---|
| Loading | Skeleton cards | Skeleton rows | Skeleton detail | Skeleton form | Map placeholder | Spinner |
| Empty | EmptyState + action | EmptyState + action | EmptyState | EmptyState not shown | EmptyState + action | EmptyState not shown |
| Error | ErrorState + retry | ErrorState + retry | ErrorState + retry | ErrorState + retry | ErrorState + retry | ErrorState + retry |
| Success | Success banner | Success banner | Success banner | SuccessState + navigate | Success banner | SuccessState + navigate |
| Offline | Offline banner + cache | Offline banner + cache | Offline banner + cache | Disable submit | Offline banner | Disable submit |
| Permission | Show without data | Show without data | Show without data | Show without data | Permission banner | Show without data |

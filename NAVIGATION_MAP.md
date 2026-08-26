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
├── /choose-login-method (Choose Login Method)
├── /home (Home Shell)
│   ├── /rooms (Rooms Home)
│   ├── /rides (Rides Home)
│   ├── /community (Community Home)
│   └── /notifications (Notifications Inbox)
├── /explore (Explore Shell)
├── /search (Global Search)
├── /saved (Saved Items)
├── /profile (Profile)
│   └── /settings (Settings)
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
│   ├── /rooms/map
│   ├── /rooms/filters
│   ├── /rooms/saved
│   ├── /rooms/my-listings
│   ├── /rooms/create-listing
│   ├── /rooms/[roomId]
│   │   └── /rooms/[roomId]/edit
│   └── /rooms/[roomId]/details
├── /rides/*
│   ├── /rides/search
│   ├── /rides/map
│   ├── /rides/filters
│   ├── /rides/offer
│   ├── /rides/request
│   ├── /rides/saved
│   ├── /rides/mine
│   ├── /rides/history
│   ├── /rides/[rideId]
│   │   ├── /rides/[rideId]/manage
│   │   ├── /rides/[rideId]/seat-requests
│   │   ├── /rides/[rideId]/participants
│   │   └── /rides/[rideId]/rate
│   └── /rides/[rideId]/details
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
│   │   └── /marketplace/[listingId]/details
│   ├── /marketplace/sell
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
- Home → Search → Filters → Map → Offer/Request → Saved → My Rides → History
- Any list → Details → Manage → Seat Requests → Participants → Rate

### Community
- Home → Discover → Joined → Details → Create Post → Post Details

### Chat
- List → New Chat → Conversation → Conversation Info

### Admin
- Dashboard → Users → Reports → Rooms/Rides/Community/Jobs/Events Moderation → Audit Log

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
| `manabandhu://profile` | `/profile` | User profile |
| `manabandhu://admin` | `/admin` | Admin dashboard |

## 8. Permission Gates

| Screen | Permission | Action if Missing |
|---|---|---|
| /rooms/map | Location | Show permission banner + fallback list |
| /rides/map | Location | Show permission banner + fallback list |
| /utilities/nearby | Location | Show permission banner + fallback list |
| /notifications | Push Notifications | Show education banner |
| /onboarding/notifications | Push Notifications | Show education banner |
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

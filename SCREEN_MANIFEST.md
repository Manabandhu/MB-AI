# ManaBandhu Screen Manifest

## How to Read
Each screen entry includes:
- **Route**: Expo Router path
- **Module**: Owning business capability
- **Purpose**: What the user accomplishes
- **Type**: shell | auth | catalog | list | detail | form | map | filter | onboarding | settings | admin
- **States**: loading | empty | error | success | offline | permission
- **Components**: Reusable components used
- **Navigation**: Push/pop actions

---

## Foundation

### Splash
- Route: `/`
- Module: foundation
- Purpose: Brand presentation while app initializes
- Type: shell
- States: loading
- Components: ScreenShell, Image, Text
- Navigation: auto-advance to `/welcome`

### Welcome
- Route: `/welcome`
- Module: foundation
- Purpose: Introduce ManaBandhu value proposition
- Type: onboarding
- States: normal
- Components: ScreenShell, Image, Text, AppButton, PanResponder
- Navigation: advance to `/sign-in` or `/onboarding`

### Onboarding About
- Route: `/onboarding/profile-photo` (step 1)
- Module: foundation
- Purpose: Collect basic user info
- Type: form
- States: normal
- Components: FormScreen, Input, AppButton, ProgressBar
- Navigation: next to `/onboarding/location`

### Onboarding Photo
- Route: `/onboarding/profile-photo` (step 2)
- Module: foundation
- Purpose: Add profile photo (picked from the library, uploaded to the avatars bucket, saved as `avatar_url`)
- Type: form
- States: normal | uploading (progress %) | upload error | permission denied
- Components: FormScreen, Avatar, AppButton, ProgressBar, useImageUpload
- Navigation: next to `/onboarding/what-brings-you-here`

### Onboarding Reason
- Route: `/onboarding/what-brings-you-here`
- Module: foundation
- Purpose: Understand user goals
- Type: form
- States: normal
- Components: FormScreen, CheckboxGroup, AppButton, ProgressBar
- Navigation: next to `/onboarding/location`

### Onboarding Location
- Route: `/onboarding/location`
- Module: foundation
- Purpose: Set approximate location
- Type: form
- States: loading | error | permission
- Components: FormScreen, Input, AppButton, ProgressBar, Banner
- Navigation: next to `/onboarding/languages`

### Onboarding Languages
- Route: `/onboarding/languages`
- Module: foundation
- Purpose: Select preferred languages
- Type: form
- States: normal
- Components: FormScreen, ChipGroup, AppButton, ProgressBar
- Navigation: next to `/onboarding/interests`

### Onboarding Interests
- Route: `/onboarding/interests`
- Module: foundation
- Purpose: Select interest categories
- Type: form
- States: normal
- Components: FormScreen, ChipGroup, AppButton, ProgressBar
- Navigation: next to `/onboarding/notifications`

### Onboarding Notifications
- Route: `/onboarding/notifications`
- Module: foundation
- Purpose: Notification preferences (saved to notification settings; OS push prompt after choosing alerts)
- Type: form
- States: normal | permission
- Components: FormScreen, CheckboxGroup, AppButton, ProgressBar, Banner
- Navigation: next to `/onboarding/trust-and-safety`

### Onboarding Trust & Safety
- Route: `/onboarding/trust-and-safety`
- Module: foundation
- Purpose: Safety and privacy intro
- Type: form
- States: normal
- Components: FormScreen, CheckboxGroup, AppButton, ProgressBar
- Navigation: next to `/onboarding/complete`

### Onboarding Complete
- Route: `/onboarding/complete`
- Module: foundation
- Purpose: Finalize onboarding
- Type: onboarding
- States: success
- Components: ScreenShell, Image, Text, AppButton
- Navigation: to `/home`

### Home
- Route: `/home`
- Module: foundation
- Purpose: Main dashboard with personalized feed
- Type: shell
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, FeedItem, Card, SearchBar, Banner
- Navigation: push to module screens

### Explore
- Route: `/explore`
- Module: foundation
- Purpose: Discover modules and services
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SuperTile, ServiceGroup, SectionHeader, SearchBar
- Navigation: push to module screens

### Search
- Route: `/search`
- Module: foundation
- Purpose: Global search across modules
- Type: form
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, FeedItem
- Navigation: push to results

### Saved
- Route: `/saved`
- Module: foundation
- Purpose: View saved items across modules
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, TabBar, ListScreen, Card
- Navigation: push to detail

### Profile
- Route: `/profile`
- Module: foundation
- Purpose: View and edit user profile
- Type: detail
- States: loading | error
- Components: ScreenShell, Avatar, DetailScreen, AppButton, ListScreen
- Navigation: push to settings, edit profile

### Settings
- Route: `/settings`
- Module: foundation
- Purpose: App preferences and account settings
- Type: settings
- States: normal
- Components: ScreenShell, SectionHeader, ListScreen, AppButton, Modal
- Navigation: push to sub-settings, back to profile

---

## Authentication

### Sign In
- Route: `/sign-in`
- Module: auth
- Purpose: Authenticate user
- Type: auth
- States: normal | error | loading
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link
- Navigation: to `/home` on success, to `/forgot-password`

### Sign Up
- Route: `/sign-up`
- Module: auth
- Purpose: Create new account (email or Apple/Google); a required consent checkbox links to `/terms` and `/privacy` and the accepted terms version is stored on the account
- Type: auth
- States: normal | error | loading | consent missing | confirmation sent
- Components: AuthScreen, AuthField, ConsentCheckbox, SocialButtons, AuthButton
- Navigation: to onboarding on success, to `/sign-in`, `/terms`, `/privacy`

### Forgot Password
- Route: `/forgot-password`
- Module: auth
- Purpose: Initiate password reset
- Type: auth
- States: normal | success | error
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link
- Navigation: to `/reset-password`

### Phone Login
- Route: `/phone-login`
- Module: auth
- Purpose: Phone-based authentication
- Type: auth
- States: normal | error | loading
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link
- Navigation: to `/otp-verification`

### Email Login
- Route: `/email-login`
- Module: auth
- Purpose: Email magic link / OAuth entry
- Type: auth
- States: normal | error | loading
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link
- Navigation: to `/home` on success

### OTP Verification
- Route: `/otp-verification`
- Module: auth
- Purpose: Verify one-time password
- Type: auth
- States: normal | error | loading
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link, CountdownTimer
- Navigation: to `/home` on success

### Reset Password
- Route: `/reset-password`
- Module: auth
- Purpose: Set new password
- Type: auth
- States: normal | success | error
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link
- Navigation: to `/home` on success

### Choose Login Method
- Route: `/choose-login-method`
- Module: auth
- Purpose: Select authentication method
- Type: auth
- States: normal
- Components: ScreenShell, FormScreen, AppButton, Text
- Navigation: to `/phone-login` or `/email-login`

---

## Notifications

### Inbox
- Route: `/notifications`
- Module: notifications
- Purpose: View in-app notifications (server-paged), mark one or all read, swipe to mark read on phones
- Type: list
- States: loading | empty | error (retry) | refreshing (pull-to-refresh)
- Components: Screen, NotificationRow, AppButton, EmptyState, ErrorState
- Navigation: push to `/notifications/[id]`; Settings button to `/notifications/settings`

### Notification Detail
- Route: `/notifications/[id]`
- Module: notifications
- Purpose: One notification; opening it marks it read
- Type: detail
- States: loading | error (not found / not yours)
- Components: Screen, Card, Chip, AppButton
- Navigation: "Open" to the notification's in-app route; back to inbox

### Notification Settings
- Route: `/notifications/settings`
- Module: notifications
- Purpose: All-notifications pause, in-app and push channels, eight categories, quiet hours
- Type: settings
- States: loading | error (retry) | save error (switch restored) | push permission denied/unsupported
- Components: Screen, Section, Card, SettingRow, PushSection, QuietHoursSection
- Navigation: requires sign-in

---

## Rooms

### Rooms Home
- Route: `/rooms`
- Module: rooms
- Purpose: Discover available rooms (list/map toggle, city picker, quick filters, filter sheet with sort)
- Type: catalog
- States: loading | empty | error (retry) | pull-to-refresh
- Components: RoomsScreen, ScreenHeader, RoomCard, RoomFilterSheet, CityPickerSheet, RoomsMap
- Navigation: push to `/rooms/[roomId]`, `/rooms/create-listing` ("Post a room"), `/rooms/my-listings` and `/rooms/saved` (signed-out people go to sign-in)

### Rooms Search
- Route: `/rooms/search`
- Module: rooms
- Purpose: Search and filter rooms
- Type: list
- States: loading | empty | error
- Components: RoomsScreen
- Navigation: push to `/rooms/[roomId]`

### Rooms Map
- Route: `/rooms/map`
- Module: rooms
- Purpose: View rooms on a map and filter by a drawn area
- Type: map
- States: loading | empty ("no map location") | error (retry)
- Components: RoomsScreen, RoomsMap
- Navigation: push to `/rooms/[roomId]`; "Show list" appears when some rooms have no map position; after drawing an area the button reads "Show n rooms in this area"

### Rooms Filters
- Route: `/rooms/filters`
- Module: rooms
- Purpose: Filter by rent, room type, amenities (catalog codes), diet and gender (listing fields)
- Type: filter
- States: normal
- Components: RoomsScreen (filter sheet open)
- Navigation: closing replaces the screen with `/rooms` (filters persist for the session)

### Rooms Saved
- Route: `/rooms/saved`
- Module: rooms
- Purpose: The member's saved rooms from `GET /favorites`
- Type: list
- States: loading | empty | error (retry) | pull-to-refresh
- Components: Screen, RoomCard, ResponsiveGrid, EmptyState, ErrorState
- Navigation: push to `/rooms/[roomId]`

### Rooms My Listings
- Route: `/rooms/my-listings`
- Module: rooms
- Purpose: Manage own listings (Active, Drafts, Rented tabs; publish, pause, mark rented, relist, archive, delete)
- Type: list
- States: loading | empty | error (retry) | pull-to-refresh
- Components: Screen, SegmentedControl, OwnerItemCard, StatusBadge, ResponsiveGrid, useConfirm
- Navigation: push to `/rooms/[roomId]`, `/rooms/[roomId]/edit`, `/rooms/create-listing`

### Rooms Create Listing
- Route: `/rooms/create-listing`
- Module: rooms
- Purpose: Create a listing with photos and amenities; "Publish now" (primary) or "Save draft"
- Type: form
- States: normal | error | loading | upload progress
- Components: RoomForm (TextField, Chip, Card, AppButton, useImageUpload)
- Navigation: replace with `/rooms/my-listings?notice=…`

### Room Details
- Route: `/rooms/[roomId]`
- Module: rooms
- Purpose: Listing detail with real photos, amenities, pricing, and approximate area
- Type: detail
- States: loading | not found | error (retry)
- Components: Screen, ActionBar, StatusBadge, Card, Chip, BottomSheet (report, owner overflow)
- Navigation: owner → `/rooms/[roomId]/edit`; others → `/rooms/[roomId]/inquiry` or `/chat/[conversationId]`

### Edit Listing
- Route: `/rooms/[roomId]/edit`
- Module: rooms
- Purpose: Edit a listing, its photos and amenities
- Type: form
- States: normal | error | not found | loading
- Components: RoomForm
- Navigation: replace with `/rooms/my-listings?notice=…`

### Room Inquiry
- Route: `/rooms/[roomId]/inquiry`
- Module: rooms
- Purpose: Send move-in date, stay length and an introduction to the host
- Type: form
- States: normal | validation error | error | loading
- Components: Screen, TextField, Chip, DateTimeField, EmptyState, AppButton
- Navigation: replace with `/chat/[conversationId]`

---

## Rides

### Rides Home
- Route: `/rides`
- Module: rides
- Purpose: Upcoming rides: header (back; My rides, Saved, History; primary Offer a ride), From/To with swap, one filter chip row (When ▾, Women only, No tolls, Recurring, Luggage, Sort ▾), List/Map segments (side by side on dual pane), 50 per page with Load more
- Type: catalog
- States: loading | empty (Offer a ride CTA, Clear filters) | error (retry) | refreshing | more pages ("Showing the first N of M")
- Components: RidesScreen, ScreenHeader, RideLocationPicker, FilterChipRow, Chip, BottomSheet, SegmentedControl, ResponsiveGrid, RideCard, UniversalMapView, EmptyState, ErrorState
- Navigation: push to `/rides/[rideId]`, `/rides/offer`, `/rides/mine`, `/rides/saved`, `/rides/history`

### Rides Search
- Route: `/rides/search`
- Module: rides
- Purpose: Same screen as home; `?from=&to=` prefill the server-side origin/destination filters (debounced 300 ms, 50 per page). Global search and `/rides/request` link here.
- Type: list
- States: loading | empty | error | refreshing
- Components: RidesScreen
- Navigation: push to `/rides/[rideId]`

### Rides Map
- Route: `/rides/map`
- Module: rides
- Purpose: Rides home opened on the map view; pins are approximate pickup areas; draw an area to filter
- Type: map
- States: loading | empty | error
- Components: RidesScreen, UniversalMapView
- Navigation: push to `/rides/[rideId]`

### Rides Filters
- Route: `/rides/filters`
- Module: rides
- Purpose: Rides home with the When/Sort sheet open
- Type: filter
- States: normal
- Components: RidesScreen, BottomSheet, Chip
- Navigation: results update in place

### Offer Ride
- Route: `/rides/offer`
- Module: rides
- Purpose: Driver posts a ride: earlier-route template chips, places with suggestions, real route facts only, departure date/time, seats stepper 1–8 and price with inline errors, preferences (tolls, luggage, who can book), sticky Publish bar that scrolls to the first error
- Type: form
- States: normal | validation error | submitting | success | error alert
- Components: RideOfferScreen, RideFormScreen, RideLocationPicker, DeparturePicker, NumberStepper, Chip, TextField, ActionBar, InlineNotice
- Navigation: success links to `/rides/[rideId]/manage`, `/rides/[rideId]` and `/rides/mine`

### Saved Rides
- Route: `/rides/saved`
- Module: rides
- Purpose: Bookmarked and joined rides; cards open the ride, the heart removes the bookmark
- Type: list
- States: loading | empty | error (retry) | refreshing
- Components: RideSavedScreen, RideCard, ScreenHeader
- Navigation: push to `/rides/[rideId]`

### My Rides
- Route: `/rides/mine`
- Module: rides
- Purpose: Upcoming only. Tabs Driving (n) (cards open Manage; Repeat trip inline; ride page, requests, riders in More) and Riding (n) (`?tab=riding`; Open chat inline, Cancel booking in More; cancelled bookings collapsed). History in the header.
- Type: list
- States: loading | empty | error (retry) | refreshing | notice
- Components: RideMyListingsScreen, OwnerItemCard, StatusBadge, RepeatTripSheet, SegmentedControl, InlineNotice
- Navigation: push to `/rides/[rideId]`, `/rides/[rideId]/manage`, `/rides/offer`, `/rides/history`, `/chat/[id]`

### Ride History
- Route: `/rides/history`
- Module: rides
- Purpose: Completed, cancelled or departed rides you drove or rode on; Rate leads on completed rides; drivers repeat a trip
- Type: list
- States: loading | empty | error (retry) | refreshing | notice
- Components: RideHistoryScreen, OwnerItemCard, StatusBadge, RepeatTripSheet
- Navigation: push to `/rides/[rideId]`, `/rides/[rideId]/rate`, `/rides/[rideId]/manage`

### Ride Details
- Route: `/rides/[rideId]`
- Module: rides
- Purpose: Price and seats first, then the seat panel (Book a seat with a seat stepper; Your booking with Open chat and Cancel; Your seat request with Withdraw; You drive; or the reason booking is closed), route facts, women-only note, who is on the ride (members), safety advice linking to `/safety`. Sticky action bar: Book N seats / Manage ride / Open chat / Rate driver. Two columns at expanded width.
- Type: detail
- States: loading | not found | error (retry) | booked | blocked reason
- Components: RideDetailScreen, ScreenHeader, ActionBar, NumberStepper, PersonRow, StatusBadge, Chip (tag), InlineNotice
- Navigation: push to `/rides/[rideId]/manage`, `/rides/[rideId]/rate`, `/safety`, `/chat/[id]`

### Manage Ride
- Route: `/rides/[rideId]/manage`
- Module: rides
- Purpose: Driver hub with tabs Overview (status actions, total-seats stepper (only the total is sent; the server derives open seats), price, Repeat trip, Danger zone with Cancel and Delete explained), Requests (n pending; accept/decline) and Riders (bookings with cancel, cancelled collapsed; who is on the ride). Header Chat, View, Share. `?tab=requests|riders`; non-drivers are sent to the ride page.
- Type: hub
- States: loading (skeleton) | not found | error (retry) | saving | notice
- Components: RideManageScreen, ScreenHeader, SegmentedControl, NumberStepper, PersonRow, StatusBadge, RepeatTripSheet, InlineNotice
- Navigation: push to `/rides/[rideId]`, `/rides/[rideId]/rate`, `/chat/[id]`; replace to `/rides/mine` after delete

### Rate Ride
- Route: `/rides/[rideId]/rate`
- Module: rides
- Purpose: One 1–5 rating after the ride is completed; passengers rate the driver, the driver picks a rider
- Type: form
- States: loading | not found | error (retry) | not completed | submitting | sent
- Components: RideRateScreen, ScreenHeader, RatingInput, Chip, TextField
- Navigation: to `/rides/history` when sent

Redirect-only routes (not screens): `/rides/request` → `/rides/search`, `/rides/[rideId]/seat-requests` →
`/rides/[rideId]/manage?tab=requests`, `/rides/[rideId]/participants` → `/rides/[rideId]/manage?tab=riders`.

## Community

### Community Home
- Route: `/community`
- Module: community
- Purpose: View joined communities and activity
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, SectionHeader, Card, AppButton, TabBar
- Navigation: push to `/community/[communityId]`, `/community/create-post`

### Discover
- Route: `/community/discover`
- Module: community
- Purpose: Discover new communities
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card, AppButton
- Navigation: push to `/community/[communityId]`

### Joined Communities
- Route: `/community/joined`
- Module: community
- Purpose: View joined communities
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/community/[communityId]`

### Community Details
- Route: `/community/[communityId]`
- Module: community
- Purpose: View community details and posts
- Type: detail
- States: loading | error
- Components: DetailScreen, SectionHeader, ListScreen, Card, AppButton, TabBar
- Navigation: push to `/community/posts/[postId]`, `/community/create-post`

### Create Post
- Route: `/community/create-post`
- Module: community
- Purpose: Create new community post
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, TextArea, Input, ImageUpload, AppButton
- Navigation: to `/community/[communityId]` on success

### Post Details
- Route: `/community/posts/[postId]`
- Module: community
- Purpose: View post details and comments
- Type: detail
- States: loading | error | empty
- Components: DetailScreen, SectionHeader, ListScreen, AppButton, TextArea, AppButton
- Navigation: back to `/community/[communityId]`

---

## Chat

### Chat List
- Route: `/chat`
- Module: chat
- Purpose: View conversations
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, SectionHeader, ListScreen, Avatar, Card, AppButton
- Navigation: push to `/chat/[conversationId]`, `/chat/new`

### New Chat
- Route: `/chat/new`
- Module: chat
- Purpose: Start new conversation
- Type: form
- States: normal | error
- Components: ScreenShell, SearchBar, ListScreen, Avatar, AppButton
- Navigation: push to `/chat/[conversationId]`

### Conversation
- Route: `/chat/[conversationId]`
- Module: chat
- Purpose: View chat messages
- Type: detail
- States: loading | empty | error
- Components: ScreenShell, MessageBubble, Input, AppButton, Avatar, SectionHeader
- Navigation: push to `/chat/[conversationId]/info`

### Conversation Info
- Route: `/chat/[conversationId]/info`
- Module: chat
- Purpose: View conversation details and participants
- Type: detail
- States: normal | error
- Components: DetailScreen, Avatar, ListScreen, AppButton, Modal
- Navigation: back to `/chat/[conversationId]`

---

## Admin

### Dashboard
- Route: `/admin`
- Module: admin
- Purpose: Admin overview and metrics
- Type: admin
- States: loading | error
- Components: ScreenShell, MetricCard, SectionHeader, AppButton, ListScreen, TabBar
- Navigation: push to module admin screens

### Users
- Route: `/admin/users`
- Module: admin
- Purpose: Manage users
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Avatar, AppButton, Modal, SwipeAction
- Navigation: push to user detail

### Reports
- Route: `/admin/reports`
- Module: admin
- Purpose: View and manage reports
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton, Modal
- Navigation: push to report detail

### Rooms Moderation
- Route: `/admin/rooms`
- Module: admin
- Purpose: Moderate room listings
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton, Modal
- Navigation: push to `/rooms/[roomId]`

### Rides Moderation
- Route: `/admin/rides`
- Module: admin
- Purpose: Moderate rides
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton, Modal
- Navigation: push to `/rides/[rideId]`

### Community Moderation
- Route: `/admin/community`
- Module: admin
- Purpose: Moderate community content
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton, Modal
- Navigation: push to `/community/posts/[postId]`

### Jobs Moderation
- Route: `/admin/jobs`
- Module: admin
- Purpose: Moderate job postings
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton, Modal
- Navigation: push to `/jobs/[jobId]`

### Events Moderation
- Route: `/admin/events`
- Module: admin
- Purpose: Moderate events
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton, Modal
- Navigation: push to `/events/[eventId]`

### Audit Log
- Route: `/admin/audit-log`
- Module: admin
- Purpose: View system audit log
- Type: admin
- States: loading | empty | error
- Components: ScreenShell, FilterBar, ListScreen, Card, AppButton
- Navigation: none

---

## Events

### Events Home
- Route: `/events`
- Module: events
- Purpose: Discover events
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, FilterBar, Card, AppButton
- Navigation: push to `/events/search`, `/events/[eventId]`, `/events/create`

### Events Search
- Route: `/events/search`
- Module: events
- Purpose: Search events
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card
- Navigation: push to `/events/[eventId]`

### Event Details
- Route: `/events/[eventId]`
- Module: events
- Purpose: View event details
- Type: detail
- States: loading | error
- Components: DetailScreen, MapPreview, Timeline, AppButton, SectionHeader, ListScreen
- Navigation: push to `/events/create`, `/events/saved`

### Create Event
- Route: `/events/create`
- Module: events
- Purpose: Create new event
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, DateTimePicker, TextArea, ImageUpload, AppButton
- Navigation: to `/events` on success

### Saved Events
- Route: `/events/saved`
- Module: events
- Purpose: View saved events
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/events/[eventId]`

### My Events
- Route: `/events/mine`
- Module: events
- Purpose: Manage own events
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, SwipeAction
- Navigation: push to `/events/[eventId]`, `/events/create`

---

## Expenses

### Expenses Home
- Route: `/expenses`
- Module: expenses
- Purpose: View expense groups and balances
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SectionHeader, Card, AppButton, MetricCard
- Navigation: push to `/expenses/groups/[groupId]`, `/expenses/add`

### Expense Groups
- Route: `/expenses/groups`
- Module: expenses
- Purpose: View all expense groups
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/expenses/groups/[groupId]`

### Group Details
- Route: `/expenses/groups/[groupId]`
- Module: expenses
- Purpose: View group expenses and balances
- Type: detail
- States: loading | error | empty
- Components: DetailScreen, SectionHeader, ListScreen, Card, AppButton, MetricCard, TabBar
- Navigation: push to `/expenses/add`, `/expenses/settlements`

### Add Expense
- Route: `/expenses/add`
- Module: expenses
- Purpose: Add new expense
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, Select, DateTimePicker, AppButton
- Navigation: to `/expenses/groups/[groupId]` on success

### Balances
- Route: `/expenses/balances`
- Module: expenses
- Purpose: View balances across groups
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, MetricCard
- Navigation: push to `/expenses/settlements`

### Settlements
- Route: `/expenses/settlements`
- Module: expenses
- Purpose: View and process settlements
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, AppButton
- Navigation: none

---

## Immigration

### Immigration Home
- Route: `/immigration`
- Module: immigration
- Purpose: Immigration resources hub
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, SectionHeader, Card, AppButton
- Navigation: push to `/immigration/resources`, `/immigration/guides`, `/immigration/checklists`

### Resources
- Route: `/immigration/resources`
- Module: immigration
- Purpose: Browse immigration resources
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card, AppButton
- Navigation: push to `/immigration/resources/[resourceId]`

### Guides
- Route: `/immigration/guides`
- Module: immigration
- Purpose: Step-by-step immigration guides
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/immigration/resources/[resourceId]`

### Checklists
- Route: `/immigration/checklists`
- Module: immigration
- Purpose: Immigration document checklists
- type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, Checkbox, AppButton
- Navigation: none

### FAQ
- Route: `/immigration/faq`
- Module: immigration
- Purpose: Frequently asked questions
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, ListScreen, Card, AppButton
- Navigation: none

### Q&A
- Route: `/immigration/questions`
- Module: immigration
- Purpose: Community Q&A
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, TextArea
- Navigation: push to `/immigration/resources/[resourceId]`

### USCIS
- Route: `/immigration/uscis`
- Module: immigration
- Purpose: USCIS updates and alerts
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, Banner
- Navigation: push to `/immigration/resources/[resourceId]`

### Immigration News
- Route: `/immigration/news`
- Module: immigration
- Purpose: Immigration policy news
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/immigration/resources/[resourceId]`

### Saved Resources
- Route: `/immigration/saved`
- Module: immigration
- Purpose: View saved immigration resources
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/immigration/resources/[resourceId]`

### Resource Detail
- Route: `/immigration/resources/[resourceId]`
- Module: immigration
- Purpose: View resource details
- Type: detail
- States: loading | error
- Components: DetailScreen, SectionHeader, AppButton, Text, Image
- Navigation: back to `/immigration/resources`

---

## Jobs

### Jobs Home
- Route: `/jobs`
- Module: jobs
- Purpose: Discover job listings
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, FilterBar, Card, AppButton
- Navigation: push to `/jobs/search`, `/jobs/[jobId]`, `/jobs/post`

### Jobs Search
- Route: `/jobs/search`
- Module: jobs
- Purpose: Search and filter jobs
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card
- Navigation: push to `/jobs/[jobId]`

### Jobs Filters
- Route: `/jobs/filters`
- Module: jobs
- Purpose: Apply job filters
- Type: filter
- States: normal
- Components: ScreenShell, FilterBar, RangeSlider, CheckboxGroup, AppButton
- Navigation: apply to `/jobs/search`

### Saved Jobs
- Route: `/jobs/saved`
- Module: jobs
- Purpose: View saved jobs
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/jobs/[jobId]`

### Job Details
- Route: `/jobs/[jobId]`
- Module: jobs
- Purpose: View job details and apply
- Type: detail
- States: loading | error
- Components: DetailScreen, AppButton, SectionHeader, ListScreen, MapPreview
- Navigation: push to `/jobs/post`, `/jobs/saved`

### Post Job
- Route: `/jobs/post`
- Module: jobs
- Purpose: Create new job posting
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, TextArea, Select, AppButton
- Navigation: to `/jobs` on success

---

## Marketplace

### Marketplace Home
- Route: `/marketplace`
- Module: marketplace
- Purpose: Browse listings with server-side search, category, condition, price ceiling and "show reserved & sold"
- Type: catalog
- States: loading (skeleton) | empty (no listings / no matches) | error (retry) | load more | pull-to-refresh
- Components: MarketplaceHomeScreen, Screen, TextField, Chip, ResponsiveGrid, ListingCard, BottomSheet (categories)
- Navigation: push to `/marketplace/[listingId]`, `/marketplace/sell`, `/marketplace/mine`, `/marketplace/saved` (sign-in when signed out)

### Marketplace Search
- Route: `/marketplace/search`
- Module: marketplace
- Purpose: Same as home with the search field focused
- Type: catalog
- States: loading | empty | error (retry)
- Components: MarketplaceHomeScreen (`screenId="search"`)
- Navigation: push to `/marketplace/[listingId]`

### Categories
- Route: `/marketplace/categories`
- Module: marketplace
- Purpose: Same as home with the category picker open
- Type: catalog
- States: loading | empty | error (retry)
- Components: MarketplaceHomeScreen (`screenId="categories"`), BottomSheet
- Navigation: push to `/marketplace/[listingId]`

### Listing Details
- Route: `/marketplace/[listingId]`
- Module: marketplace
- Purpose: Listing with photos, status badge, details, safety tips; buyers save, chat with the seller or report; owners mark reserved/sold, relist, edit or delete
- Type: detail
- States: loading | not found | error (retry) | photos error (retry)
- Components: ListingDetailsScreen, Screen, Card, Chip, IconButton, SaveToggle, ReportListingSheet (BottomSheet)
- Navigation: buyer → `/chat/[conversationId]`; owner → `/marketplace/[listingId]/edit`, `/marketplace/mine` after delete

### Edit Listing
- Route: `/marketplace/[listingId]/edit`
- Module: marketplace
- Purpose: Owner edits details and photos
- Type: form
- States: loading | not found | not owner | error | upload progress
- Components: EditListingScreen, ListingForm
- Navigation: replace with `/marketplace/[listingId]` on save

### Sell Item
- Route: `/marketplace/sell`
- Module: marketplace
- Purpose: Create a listing with up to 10 photos (attached after create; a failed attach keeps the created listing for retry)
- Type: form
- States: normal | field errors | server error | upload progress | success
- Components: SellItemScreen, ListingForm (TextField, Chip, SegmentedControl, useImageUpload)
- Navigation: success → `/marketplace/[listingId]`, `/marketplace/mine`, or reset for another item

### Saved Items
- Route: `/marketplace/saved`
- Module: marketplace
- Purpose: The signed-in member's saved listings (`GET /favorites/listings`)
- Type: list
- States: loading | empty | error (retry) | pull-to-refresh
- Components: MarketplaceHomeScreen (`screenId="saved"`), ListingCard
- Navigation: push to `/marketplace/[listingId]`

### My Listings
- Route: `/marketplace/mine`
- Module: marketplace
- Purpose: The seller's listings in every status (For sale / Sold / All) with mark reserved, mark sold, relist, edit and delete
- Type: list
- States: loading | empty | error (retry) | pull-to-refresh
- Components: MyListingsScreen, SegmentedControl, Card, AppButton
- Navigation: push to `/marketplace/[listingId]`, `/marketplace/[listingId]/edit`, `/marketplace/sell`

---

## Referrals

### Referrals Home
- Route: `/referrals`
- Module: referrals
- Purpose: Manage referrals
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SectionHeader, Card, AppButton, MetricCard
- Navigation: push to `/referrals/request`, `/referrals/offer`, `/referrals/[referralId]`

### Request Referral
- Route: `/referrals/request`
- Module: referrals
- Purpose: Request a referral
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, TextArea, Select, AppButton
- Navigation: to `/referrals` on success

### Offer Referral
- Route: `/referrals/offer`
- Module: referrals
- Purpose: Offer a referral
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, TextArea, Select, AppButton
- Navigation: to `/referrals` on success

### Referral Details
- Route: `/referrals/[referralId]`
- Module: referrals
- Purpose: View referral details
- Type: detail
- States: loading | error
- Components: DetailScreen, SectionHeader, AppButton, ListScreen, Timeline
- Navigation: back to `/referrals`

### My Referrals
- Route: `/referrals/mine`
- Module: referrals
- Purpose: View my referrals
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, TabBar
- Navigation: push to `/referrals/[referralId]`

---

## Safety

### Safety Center
- Route: `/safety`
- Module: safety
- Purpose: Safety tools and resources
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SectionHeader, Card, AppButton, Banner
- Navigation: push to `/safety/reports`, `/safety/blocked-users`, `/safety/trusted-contacts`

### Reports
- Route: `/safety/reports`
- Module: safety
- Purpose: View and file safety reports
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, AppButton
- Navigation: push to report detail

### Blocked Users
- Route: `/safety/blocked-users`
- Module: safety
- Purpose: Manage blocked users
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Avatar, Card, AppButton, SwipeAction
- Navigation: none

### Trusted Contacts
- Route: `/safety/trusted-contacts`
- Module: safety
- Purpose: Manage trusted contacts
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Avatar, Card, AppButton, AppButton
- Navigation: push to add contact form

---

## Utilities

### Utilities Home
- Route: `/utilities`
- Module: utilities
- Purpose: Utility tools hub
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SectionHeader, Card, AppButton
- Navigation: push to `/utilities/packages`, `/utilities/nearby`, `/utilities/emergency`

### Package Tracking
- Route: `/utilities/packages`
- Module: utilities
- Purpose: Track packages
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, ListScreen, Card, AppButton, Timeline
- Navigation: push to package detail

### Nearby
- Route: `/utilities/nearby`
- Module: utilities
- Purpose: Find nearby services
- Type: map
- States: loading | empty | error | permission
- Components: ScreenShell, MapView, MapPin, Card, SearchBar, FilterBar
- Navigation: push to place detail

### Emergency Resources
- Route: `/utilities/emergency`
- Module: utilities
- Purpose: Emergency contacts and resources
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, Banner
- Navigation: none

---

## AI Assistant

### Assistant
- Route: `/assistant`
- Module: ai-assistant
- Purpose: Chat with AI assistant
- Type: chat
- States: loading | empty | error | offline
- Components: ScreenShell, MessageBubble, Input, AppButton, Avatar, SectionHeader, Banner
- Navigation: push to `/assistant/history`, `/assistant/citations`

### Assistant History
- Route: `/assistant/history`
- Module: ai-assistant
- Purpose: View past conversations
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/assistant`

### Assistant Citations
- Route: `/assistant/citations`
- Module: ai-assistant
- Purpose: View source citations
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: back to `/assistant`

---

## Account & legal

### Account & Data
- Route: `/settings/account`
- Module: foundation
- Purpose: Change email or phone, download a JSON copy of your data, delete the account
- Type: settings
- States: normal | busy | notice (change pending confirmation) | error | re-auth sheet | delete confirm sheet
- Components: Screen, Section, Card, TextField, AppButton, ListRow, BottomSheet, ReauthSheet
- Navigation: requires sign-in; links to `/terms` and `/privacy`; after deletion goes to `/welcome`

### Terms of Service
- Route: `/terms`
- Module: foundation
- Purpose: Terms (versioned; sign-up records the accepted version)
- Type: document
- States: normal
- Components: Screen, Card, AppText, IconButton
- Navigation: public; back

### Privacy Policy
- Route: `/privacy`
- Module: foundation
- Purpose: What is collected, processors, choices (export and delete)
- Type: document
- States: normal
- Components: Screen, Card, AppText, IconButton
- Navigation: public; back

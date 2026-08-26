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
- Purpose: Add profile photo
- Type: form
- States: normal
- Components: FormScreen, Avatar, AppButton, ProgressBar
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
- Purpose: Notification preferences
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
- Purpose: Create new account
- Type: auth
- States: normal | error | loading
- Components: ScreenShell, FormScreen, Input, AppButton, Text, Link
- Navigation: to `/home` on success, to `/sign-in`

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
- Purpose: View in-app notifications
- Type: list
- States: loading | empty | error | offline
- Components: ScreenShell, SectionHeader, ListScreen, FeedItem, Banner, AppButton
- Navigation: push to related screen

---

## Rooms

### Rooms Home
- Route: `/rooms`
- Module: rooms
- Purpose: Discover available rooms
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, FilterBar, Card, MapPreview, AppButton
- Navigation: push to `/rooms/search`, `/rooms/map`, `/rooms/filters`, `/rooms/saved`

### Rooms Search
- Route: `/rooms/search`
- Module: rooms
- Purpose: Search and filter rooms
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card, MapPreview
- Navigation: push to `/rooms/[roomId]`, `/rooms/map`, `/rooms/filters`

### Rooms Map
- Route: `/rooms/map`
- Module: rooms
- Purpose: View rooms on map
- Type: map
- States: loading | empty | error | permission
- Components: ScreenShell, MapView, MapPin, Card, FilterBar, SearchBar
- Navigation: push to `/rooms/[roomId]`, `/rooms/search`

### Rooms Filters
- Route: `/rooms/filters`
- Module: rooms
- Purpose: Apply search filters
- Type: filter
- States: normal
- Components: ScreenShell, FilterBar, RangeSlider, CheckboxGroup, AppButton
- Navigation: apply to `/rooms/search`

### Rooms Saved
- Route: `/rooms/saved`
- Module: rooms
- Purpose: View saved rooms
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/rooms/[roomId]`

### Rooms My Listings
- Route: `/rooms/my-listings`
- Module: rooms
- Purpose: Manage own room listings
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, SwipeAction
- Navigation: push to `/rooms/[roomId]/edit`, `/rooms/create-listing`

### Rooms Create Listing
- Route: `/rooms/create-listing`
- Module: rooms
- Purpose: Create new room listing
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, TextArea, ImageUpload, CheckboxGroup, AppButton
- Navigation: to `/rooms/my-listings` on success

### Room Details
- Route: `/rooms/[roomId]`
- Module: rooms
- Purpose: View room details
- Type: detail
- States: loading | error
- Components: DetailScreen, ImageGallery, MapPreview, AppButton, SectionHeader, ListScreen
- Navigation: push to `/rooms/[roomId]/edit`, `/rooms/saved`

### Edit Listing
- Route: `/rooms/[roomId]/edit`
- Module: rooms
- Purpose: Edit room listing
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, TextArea, ImageUpload, AppButton
- Navigation: back to `/rooms/[roomId]`, `/rooms/my-listings`

---

## Rides

### Rides Home
- Route: `/rides`
- Module: rides
- Purpose: Discover available rides
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, FilterBar, Card, AppButton
- Navigation: push to `/rides/search`, `/rides/map`, `/rides/filters`, `/rides/offer`

### Rides Search
- Route: `/rides/search`
- Module: rides
- Purpose: Search and filter rides
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card
- Navigation: push to `/rides/[rideId]`, `/rides/map`, `/rides/filters`

### Rides Map
- Route: `/rides/map`
- Module: rides
- Purpose: View rides on map
- Type: map
- States: loading | empty | error | permission
- Components: ScreenShell, MapView, MapPin, Card, FilterBar, SearchBar
- Navigation: push to `/rides/[rideId]`, `/rides/search`

### Rides Filters
- Route: `/rides/filters`
- Module: rides
- Purpose: Apply ride filters
- Type: filter
- States: normal
- Components: ScreenShell, FilterBar, RangeSlider, CheckboxGroup, AppButton
- Navigation: apply to `/rides/search`

### Offer Ride
- Route: `/rides/offer`
- Module: rides
- Purpose: Offer a new ride
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, DateTimePicker, MapPicker, CheckboxGroup, AppButton
- Navigation: to `/rides` on success

### Request Ride
- Route: `/rides/request`
- Module: rides
- Purpose: Request a ride
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, DateTimePicker, AppButton
- Navigation: to `/rides` on success

### Saved Rides
- Route: `/rides/saved`
- Module: rides
- Purpose: View saved rides
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/rides/[rideId]`

### My Rides
- Route: `/rides/mine`
- Module: rides
- Purpose: Manage own rides
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, SwipeAction
- Navigation: push to `/rides/[rideId]/manage`, `/rides/[rideId]/seat-requests`

### Ride History
- Route: `/rides/history`
- Module: rides
- Purpose: View past rides
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/rides/[rideId]/rate`

### Ride Details
- Route: `/rides/[rideId]`
- Module: rides
- Purpose: View ride details
- Type: detail
- States: loading | error
- Components: DetailScreen, MapPreview, Timeline, AppButton, SectionHeader
- Navigation: push to `/rides/[rideId]/manage`, `/rides/[rideId]/seat-requests`

### Manage Ride
- Route: `/rides/[rideId]/manage`
- Module: rides
- Purpose: Manage ride settings and status
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, Select, AppButton, Modal
- Navigation: back to `/rides/[rideId]`

### Seat Requests
- Route: `/rides/[rideId]/seat-requests`
- Module: rides
- Purpose: Review and manage seat requests
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton, SwipeAction
- Navigation: push to user profile

### Participants
- Route: `/rides/[rideId]/participants`
- Module: rides
- Purpose: View ride participants
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Avatar, Card, AppButton
- Navigation: push to user profile

### Rate Ride
- Route: `/rides/[rideId]/rate`
- Module: rides
- Purpose: Rate ride experience
- Type: form
- States: normal | success
- Components: FormScreen, StarRating, TextArea, AppButton
- Navigation: to `/rides/history` on success

---

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
- Purpose: Buy and sell items
- Type: catalog
- States: loading | empty | error
- Components: CatalogScreen, SearchBar, FilterBar, Card, AppButton
- Navigation: push to `/marketplace/search`, `/marketplace/[listingId]`, `/marketplace/sell`

### Marketplace Search
- Route: `/marketplace/search`
- Module: marketplace
- Purpose: Search listings
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SearchBar, FilterBar, ListScreen, Card
- Navigation: push to `/marketplace/[listingId]`

### Categories
- Route: `/marketplace/categories`
- Module: marketplace
- Purpose: Browse categories
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/marketplace/search`

### Listing Details
- Route: `/marketplace/[listingId]`
- Module: marketplace
- Purpose: View listing details
- Type: detail
- States: loading | error
- Components: DetailScreen, ImageGallery, AppButton, SectionHeader, ListScreen
- Navigation: push to `/marketplace/sell`, `/marketplace/saved`

### Sell Item
- Route: `/marketplace/sell`
- Module: marketplace
- Purpose: Create new listing
- Type: form
- States: normal | error | success | loading
- Components: FormScreen, Input, TextArea, ImageUpload, Select, AppButton
- Navigation: to `/marketplace` on success

### Saved Items
- Route: `/marketplace/saved`
- Module: marketplace
- Purpose: View saved listings
- Type: list
- States: loading | empty | error
- Components: ScreenShell, SectionHeader, ListScreen, Card, AppButton
- Navigation: push to `/marketplace/[listingId]`

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

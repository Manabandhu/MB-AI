// Canonical product screen inventory (ADR 0004). `pnpm verify:screens` (scripts/verify-screen-catalog.mjs) fails when
// a route here has no file under src/app or a route file is missing from this list, so keep routes as string literals.

export type ScreenDefinition = {
  id: string;
  title: string;
  route: string;
};

export type ScreenGroup = {
  module: string;
  screens: readonly ScreenDefinition[];
};

const screen = (module: string, slug: string, title: string, route = `/${module}/${slug}`) => ({
  id: `${module}.${slug.replaceAll('/', '.')}`,
  title,
  route,
});

export const screenCatalog = [
  {
    module: 'foundation',
    screens: [
      screen('foundation', 'splash', 'Splash', '/'),
      screen('foundation', 'welcome', 'Welcome', '/welcome'),
      screen('auth', 'sign-in', 'Sign In', '/sign-in'),
      screen('auth', 'sign-up', 'Sign Up', '/sign-up'),
      screen('auth', 'phone-login', 'Phone Login', '/phone-login'),
      screen('auth', 'otp-verification', 'OTP Verification', '/otp-verification'),
      screen('auth', 'forgot-password', 'Forgot Password', '/forgot-password'),
      screen('auth', 'reset-password', 'Reset Password', '/reset-password'),
      screen('auth', 'callback', 'Sign-in Callback', '/auth/callback'),
      screen('auth', 'accept-terms', 'Accept Terms', '/accept-terms'),
      screen('foundation', 'onboarding', 'Onboarding', '/onboarding'),
      screen(
        'foundation',
        'onboarding/what-brings-you-here',
        'Onboarding Goals',
        '/onboarding/what-brings-you-here',
      ),
      screen('foundation', 'onboarding/location', 'Onboarding Location', '/onboarding/location'),
      screen('foundation', 'onboarding/languages', 'Onboarding Languages', '/onboarding/languages'),
      screen('foundation', 'onboarding/interests', 'Onboarding Interests', '/onboarding/interests'),
      screen(
        'foundation',
        'onboarding/profile-photo',
        'Onboarding Profile Photo',
        '/onboarding/profile-photo',
      ),
      screen(
        'foundation',
        'onboarding/notifications',
        'Onboarding Notifications',
        '/onboarding/notifications',
      ),
      screen(
        'foundation',
        'onboarding/trust-and-safety',
        'Onboarding Trust & Safety',
        '/onboarding/trust-and-safety',
      ),
      screen('foundation', 'onboarding/complete', 'Onboarding Complete', '/onboarding/complete'),
      screen('foundation', 'home', 'Home', '/home'),
      screen('foundation', 'explore', 'Explore', '/explore'),
      screen('foundation', 'search', 'Global Search', '/search'),
      screen('foundation', 'saved', 'Saved', '/saved'),
      screen('foundation', 'profile', 'Profile', '/profile'),
      screen('foundation', 'settings', 'Settings', '/settings'),
      screen('foundation', 'settings/account', 'Account & Data', '/settings/account'),
      screen('foundation', 'terms', 'Terms of Service', '/terms'),
      screen('foundation', 'privacy', 'Privacy Policy', '/privacy'),
    ],
  },
  {
    module: 'notifications',
    screens: [
      screen('notifications', 'inbox', 'Notifications', '/notifications'),
      screen('notifications', 'details', 'Notification Details', '/notifications/[id]'),
      screen('notifications', 'settings', 'Notification Settings'),
    ],
  },
  {
    module: 'rooms',
    screens: [
      screen('rooms', 'home', 'Rooms Home', '/rooms'),
      screen('rooms', 'search', 'Search'),
      screen('rooms', 'map', 'Map'),
      screen('rooms', 'filters', 'Filters'),
      screen('rooms', 'saved', 'Saved Rooms'),
      screen('rooms', 'my-listings', 'My Listings'),
      screen('rooms', 'create-listing', 'Create Listing'),
      screen('rooms', 'details', 'Room Details', '/rooms/[roomId]'),
      screen('rooms', 'edit-listing', 'Edit Listing', '/rooms/[roomId]/edit'),
      screen('rooms', 'inquiry', 'Room Inquiry', '/rooms/[roomId]/inquiry'),
    ],
  },
  {
    module: 'rides',
    screens: [
      screen('rides', 'home', 'Rides Home', '/rides'),
      screen('rides', 'search', 'Search'),
      screen('rides', 'map', 'Map'),
      screen('rides', 'filters', 'Filters'),
      screen('rides', 'offer', 'Offer Ride'),
      screen('rides', 'saved', 'Saved Rides'),
      screen('rides', 'mine', 'My Rides'),
      screen('rides', 'history', 'Ride History'),
      screen('rides', 'details', 'Ride Details', '/rides/[rideId]'),
      screen('rides', 'manage', 'Manage Ride', '/rides/[rideId]/manage'),
      screen('rides', 'rate', 'Rate Ride', '/rides/[rideId]/rate'),
    ],
  },
  {
    module: 'jobs',
    screens: [
      screen('jobs', 'home', 'Jobs Home', '/jobs'),
      screen('jobs', 'search', 'Search'),
      screen('jobs', 'filters', 'Filters'),
      screen('jobs', 'saved', 'Saved Jobs'),
      screen('jobs', 'details', 'Job Details', '/jobs/[jobId]'),
      screen('jobs', 'post', 'Post Job'),
    ],
  },
  {
    module: 'referrals',
    screens: [
      screen('referrals', 'home', 'Referral Home', '/referrals'),
      screen('referrals', 'request', 'Request Referral'),
      screen('referrals', 'offer', 'Offer Referral'),
      screen('referrals', 'details', 'Referral Details', '/referrals/[referralId]'),
      screen('referrals', 'mine', 'My Referrals'),
    ],
  },
  {
    module: 'community',
    screens: [
      screen('community', 'home', 'Community Home', '/community'),
      screen('community', 'discover', 'Discover'),
      screen('community', 'joined', 'Joined Communities'),
      screen('community', 'details', 'Community Details', '/community/[communityId]'),
      screen('community', 'create-post', 'Create Post'),
      screen('community', 'post-details', 'Post Details', '/community/posts/[postId]'),
    ],
  },
  {
    module: 'chat',
    screens: [
      screen('chat', 'list', 'Chat List', '/chat'),
      screen('chat', 'new', 'New Chat'),
      screen('chat', 'conversation', 'Conversation', '/chat/[conversationId]'),
      screen('chat', 'info', 'Conversation Info', '/chat/[conversationId]/info'),
    ],
  },
  {
    module: 'immigration',
    screens: [
      screen('immigration', 'home', 'Immigration Home', '/immigration'),
      screen('immigration', 'resources', 'Resources'),
      screen('immigration', 'guides', 'Guides'),
      screen('immigration', 'checklists', 'Checklists'),
      screen('immigration', 'faq', 'FAQ'),
      screen('immigration', 'questions', 'Q&A'),
      screen('immigration', 'uscis', 'USCIS'),
      screen('immigration', 'news', 'Immigration News'),
      screen('immigration', 'saved', 'Saved Resources'),
      screen('immigration', 'resource', 'Resource Detail', '/immigration/resources/[resourceId]'),
    ],
  },
  {
    module: 'expenses',
    screens: [
      screen('expenses', 'home', 'Expenses Home', '/expenses'),
      screen('expenses', 'groups', 'Groups'),
      screen('expenses', 'group-details', 'Group Details', '/expenses/groups/[groupId]'),
      screen('expenses', 'add', 'Add Expense'),
      screen('expenses', 'balances', 'Balances'),
      screen('expenses', 'settlements', 'Settlements'),
    ],
  },
  {
    module: 'events',
    screens: [
      screen('events', 'home', 'Events Home', '/events'),
      screen('events', 'search', 'Search'),
      screen('events', 'details', 'Event Details', '/events/[eventId]'),
      screen('events', 'create', 'Create Event'),
      screen('events', 'saved', 'Saved Events'),
      screen('events', 'mine', 'My Events'),
    ],
  },
  {
    module: 'marketplace',
    screens: [
      screen('marketplace', 'home', 'Marketplace Home', '/marketplace'),
      screen('marketplace', 'search', 'Search'),
      screen('marketplace', 'categories', 'Categories'),
      screen('marketplace', 'details', 'Listing Details', '/marketplace/[listingId]'),
      screen('marketplace', 'edit-listing', 'Edit Listing', '/marketplace/[listingId]/edit'),
      screen('marketplace', 'sell', 'Sell Item'),
      screen('marketplace', 'saved', 'Saved Items'),
      screen('marketplace', 'mine', 'My Listings'),
    ],
  },
  {
    module: 'utilities',
    screens: [
      screen('utilities', 'home', 'Utilities Home', '/utilities'),
      screen('utilities', 'packages', 'Package Tracking'),
      screen('utilities', 'nearby', 'Nearby'),
      screen('utilities', 'emergency', 'Emergency Resources'),
    ],
  },
  {
    module: 'safety',
    screens: [
      screen('safety', 'center', 'Safety Center', '/safety'),
      screen('safety', 'reports', 'Reports'),
      screen('safety', 'blocked-users', 'Blocked Users'),
      screen('safety', 'trusted-contacts', 'Trusted Contacts'),
    ],
  },
  {
    module: 'assistant',
    screens: [
      screen('assistant', 'home', 'Assistant', '/assistant'),
      screen('assistant', 'history', 'Assistant History'),
      screen('assistant', 'citations', 'Assistant Citations'),
    ],
  },
  {
    module: 'admin',
    screens: [
      screen('admin', 'dashboard', 'Dashboard', '/admin'),
      screen('admin', 'users', 'Users'),
      screen('admin', 'users/detail', 'User Details', '/admin/users/[userId]'),
      screen('admin', 'reports', 'Reports'),
      screen('admin', 'reports/detail', 'Report Details', '/admin/reports/[reportId]'),
      screen('admin', 'rooms', 'Rooms Moderation'),
      screen('admin', 'rides', 'Rides Moderation'),
      screen('admin', 'community', 'Community Moderation'),
      screen('admin', 'jobs', 'Jobs Moderation'),
      screen('admin', 'events', 'Events Moderation'),
      screen('admin', 'automations', 'Automations'),
      screen('admin', 'audit-log', 'Audit Log'),
    ],
  },
] as const satisfies readonly ScreenGroup[];

export const screenCount = screenCatalog.reduce((total, group) => total + group.screens.length, 0);

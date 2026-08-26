export const foundationFixtures = {
  metrics: [
    { label: 'Communities', value: '12' },
    { label: 'Saved Items', value: '34' },
    { label: 'Messages', value: '5' },
  ],
  quickActions: [
    { label: 'Find a Room', route: '/rooms', icon: 'bed' as const },
    { label: 'Offer a Ride', route: '/rides', icon: 'car' as const },
    { label: 'Ask a Question', route: '/community', icon: 'community' as const },
    { label: 'Find a Job', route: '/jobs', icon: 'briefcase' as const },
    { label: 'Chat', route: '/chat', icon: 'message' as const },
    { label: 'Events', route: '/events', icon: 'calendar' as const },
    { label: 'Buy & Sell', route: '/marketplace', icon: 'marketplace' as const },
    { label: 'Expenses', route: '/expenses', icon: 'wallet' as const },
    { label: 'Immigration', route: '/immigration', icon: 'book' as const },
    { label: 'Utilities', route: '/utilities', icon: 'wrench' as const },
    { label: 'Safety', route: '/safety', icon: 'shield' as const },
    { label: 'Referrals', route: '/referrals', icon: 'help' as const },
  ],
  feed: [
    {
      id: 'f1',
      title: 'Welcome to ManaBandhu',
      body: 'Discover rooms, rides, jobs, and more in your community.',
      meta: 'Just now',
    },
    {
      id: 'f2',
      title: 'Complete your profile',
      body: 'Add a photo and location to get started.',
      meta: '2h ago',
    },
  ],
};

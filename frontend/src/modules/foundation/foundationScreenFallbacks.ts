import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const foundationScreenFallbacks: Record<string, CatalogScreenContent> = {
  onboarding: {
    eyebrow: 'Getting Started',
    title: 'Set up your ManaBandhu space',
    subtitle:
      'Choose your city, interests, and safety preferences so the app feels useful from day one.',
    metrics: [
      { label: 'Setup time', value: '2 min' },
      { label: 'Privacy steps', value: '3' },
    ],
    items: [
      {
        id: 'location',
        title: 'Pick your local area',
        body: 'Use a broad neighborhood or city so discovery works without exposing precise location.',
        meta: 'Location privacy first',
      },
      {
        id: 'interests',
        title: 'Select what you need',
        body: 'Rooms, rides, jobs, events, community help, safety, and utilities can be tuned any time.',
        meta: 'Personalized modules',
      },
    ],
  },
  explore: {
    eyebrow: 'Explore',
    title: 'Everything nearby, organized',
    subtitle:
      'Jump into rooms, rides, jobs, events, services, and community posts from one discovery surface.',
    metrics: [
      { label: 'Modules', value: '9' },
      { label: 'Saved searches', value: '4' },
    ],
    items: [
      {
        id: 'rooms',
        title: 'Rooms',
        body: 'Find shared housing and trusted listings.',
        route: '/rooms',
        meta: 'Open rooms',
      },
      {
        id: 'rides',
        title: 'Rides',
        body: 'Offer or request safe local and airport rides.',
        route: '/rides',
        meta: 'Open rides',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        body: 'See updates from your communities and saved searches.',
        route: '/notifications',
        meta: 'Open inbox',
      },
    ],
  },
  search: {
    eyebrow: 'Search',
    title: 'Search across ManaBandhu',
    subtitle:
      'A unified search home for listings, rides, people, guides, events, and help requests.',
    metrics: [
      { label: 'Categories', value: '12' },
      { label: 'Recent searches', value: '5' },
    ],
    items: [
      {
        id: 'query',
        title: 'Start with a need',
        body: 'Try “room near Plano”, “airport ride”, or “job referral”.',
        meta: 'Smart suggestions',
      },
      {
        id: 'filters',
        title: 'Refine fast',
        body: 'Filter by distance, price, availability, trust signals, and module.',
        meta: 'Cross-module filters',
      },
    ],
  },
  saved: {
    eyebrow: 'Saved',
    title: 'Your saved things',
    subtitle:
      'Saved rooms, rides, events, jobs, marketplace items, and resources live in one calm place.',
    metrics: [
      { label: 'Saved items', value: '18' },
      { label: 'Updated today', value: '6' },
    ],
    items: [
      {
        id: 'room',
        title: 'Sunny room in Irving',
        body: 'Available next month with verified host notes.',
        route: '/rooms/demo-room-1',
        meta: 'Room',
      },
      {
        id: 'ride',
        title: 'DFW airport ride',
        body: 'Saturday morning ride with two seats left.',
        meta: 'Ride',
      },
    ],
  },
  profile: {
    eyebrow: 'Profile',
    title: 'Your community profile',
    subtitle:
      'Manage your visible name, trust signals, interests, and the ways others can safely contact you.',
    metrics: [
      { label: 'Profile strength', value: '72%' },
      { label: 'Trust checks', value: '2' },
    ],
    items: [
      {
        id: 'identity',
        title: 'Identity and privacy',
        body: 'Control your display name, pronouns, language, and location precision.',
        meta: 'Editable',
      },
      {
        id: 'activity',
        title: 'Recent activity',
        body: 'Your posts, listings, rides, saves, and community contributions.',
        meta: 'Private by default',
      },
    ],
  },
  settings: {
    eyebrow: 'Settings',
    title: 'Preferences and safety',
    subtitle: 'Tune notifications, language, privacy, blocked users, security, and app appearance.',
    metrics: [
      { label: 'Notification groups', value: '5' },
      { label: 'Privacy controls', value: '8' },
    ],
    items: [
      {
        id: 'notifications',
        title: 'Notification preferences',
        body: 'Choose what reaches in-app, push, email, or SMS later.',
        route: '/notifications',
        meta: 'Review',
      },
      {
        id: 'privacy',
        title: 'Privacy and safety',
        body: 'Manage blocked users, trusted contacts, and sensitive data choices.',
        meta: 'Protected',
      },
    ],
  },
};

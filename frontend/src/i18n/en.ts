/** English strings for the app shell, Home, and settings. Modules add their own namespaces as they migrate. */
export const en = {
  tabs: {
    home: 'Home',
    explore: 'Explore',
    community: 'Community',
    chat: 'Chat',
    profile: 'Profile',
  },
  greeting: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    welcomeBack: 'Welcome back',
  },
  home: {
    quickAccess: 'Quick access',
    communityPulse: 'Community pulse',
    searchPlaceholder: 'Search rooms, rides, jobs, people…',
    changeCity: 'Change city',
    linkCopied: 'Link copied',
    updated: 'Updated {{when}}',
    invite: 'Invite a friend',
    inviteMessage: 'Join me on ManaBandhu — rooms, rides, jobs, and friends in one community app.',
  },
  shell: {
    notifications: 'Open notifications',
    openProfile: 'Open profile',
    settings: 'Open settings',
    search: 'Search rooms, rides, jobs…',
  },
  appearance: {
    title: 'Appearance',
    theme: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    animations: 'Animations',
    full: 'Full',
    reduced: 'Reduced',
    off: 'Off',
    motionNote: "Your device's reduce-motion setting always limits animations.",
    language: 'Language',
  },
  profile: { activity: 'Your activity', account: 'Account', signOut: 'Sign out' },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Strings = Widen<typeof en>;

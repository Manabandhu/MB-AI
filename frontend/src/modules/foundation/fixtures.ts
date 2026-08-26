export const demoCredentials = {
  email: 'demo@manabandhu.local',
  password: 'DemoPass123',
} as const;

export const onboardingFixture = {
  about: {
    step: 1,
    title: 'About You',
    body: 'Tell us a bit about yourself to get started.',
    inputs: ['First Name', 'Last Name', 'Preferred Name', 'Date of Birth'],
    options: [],
    next: '/onboarding/profile-photo',
  },
  photo: {
    step: 2,
    title: 'Profile Photo',
    body: 'Add a friendly photo so community members can recognize you.',
    inputs: [],
    options: ['Upload Photo', 'Use Initials', 'Skip for now'],
    next: '/onboarding/what-brings-you-here',
  },
  reason: {
    step: 3,
    title: 'What brings you here?',
    body: 'Select the ways ManaBandhu can help you.',
    inputs: [],
    options: [
      'Find a room',
      'Offer or request rides',
      'Find jobs',
      'Join community',
      'Local services',
    ],
    next: '/onboarding/location',
  },
  location: {
    step: 4,
    title: 'Your Location',
    body: 'Use a broad area to personalize discovery while protecting privacy.',
    inputs: ['City or neighborhood'],
    options: ['Use current location', 'Set manually'],
    next: '/onboarding/languages',
  },
  languages: {
    step: 5,
    title: 'Languages',
    body: 'Choose languages you are comfortable using.',
    inputs: [],
    options: ['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Spanish'],
    next: '/onboarding/interests',
  },
  interests: {
    step: 6,
    title: 'Interests',
    body: 'Tune your home feed with what matters most.',
    inputs: [],
    options: ['Rooms', 'Rides', 'Jobs', 'Events', 'Immigration', 'Marketplace', 'Safety'],
    next: '/onboarding/notifications',
  },
  notifications: {
    step: 7,
    title: 'Notifications',
    body: 'Choose how ManaBandhu should keep you updated.',
    inputs: [],
    options: ['Room matches', 'Ride updates', 'Community replies', 'Safety alerts'],
    next: '/onboarding/trust-and-safety',
  },
  trust: {
    step: 8,
    title: 'Trust & Safety',
    body: 'Review privacy, reporting, and trusted contact settings.',
    inputs: [],
    options: ['Verify profile', 'Add trusted contact', 'Review safety tips'],
    next: '/onboarding/complete',
  },
  complete: {
    step: 9,
    title: 'You’re all set',
    body: 'Your ManaBandhu community is ready.',
    inputs: [],
    options: ['Explore home', 'Find a room', 'Offer a ride'],
    next: '/home',
  },
} as const;

export const welcomeFlowFixture = [
  {
    title: 'Find the help you need',
    body: 'Rooms, rides, jobs, local services, and useful information in one friendly app.',
    image:
      'https://lh3.googleusercontent.com/aida/AP1WRLuihH-mSVxYhIAX0g3XSpYMHRaSs0kbK5uQCKWYinPX-8Gkfl0D6QOOYna7jkBL-XBFoAgVulXErCpyQxyPCXcAFjLvy8jUchV2mluO1-uL1mm0N53J5icFnoXEut4vWkPDovzsDhbjMYB3SbmrvZvVAFyhDinQIniIh2UHI3jjzSfcdaU86ZtypYnANXAoePqFb5RoSedJnEh9vDlYoCc5JD_MXTe_2yhbvQKJTTzwkevVyWz28B_ktfg',
    action: 'Next',
  },
  {
    title: 'Connect with people you can trust',
    body: 'Ask questions, join communities, chat safely, and meet people nearby.',
    image:
      'https://lh3.googleusercontent.com/aida/AP1WRLtUf2ODs2thv2Z3Tn-zrq2aaYnq5daSL9KBeeHzLFYPNJDJO4vD7UcsoIaltEvAbFrubE_vZrNGdGO7BzEX972UyQL9JthY2LS5FgRQMeLeAS43Xo2flktTuSUyxHVbfsTJ4G76kcuaR1yjJrSb6yZIoYTXfaPKaAkfNWGohBFMJV2Oa5QuO7-okaQO5kx7T2Gw7fqG8KggE0Vdny10VVgAS-d0JbHYNSThckQ6FCLQaVD-scfhzIQK9x8',
    action: 'Next',
  },
  {
    title: 'Make everyday life easier.',
    body: 'Share expenses, find events, track packages, and stay organized.',
    image:
      'https://lh3.googleusercontent.com/aida/AP1WRLsnX0Z0wRXO1bksJlF36mVKcxGpWmLHDKh29_dDO-daHA-WP1kZN6-es7SZecpR_E9zdLoffF80G3fOX9M0i3_caLaWhTKfh0-eg85lYLp4mxvpEOp4DdqjjekgMhByhMLrJggPuIra_sofSIGmHJ6DnTE4EOKEaGGD04XoInVhxLtiYar_nTsvhPklWvpaxQOZ_9-FLtTUoVx71PxgUfThSVk0lbXBgQ0v1ODZt0a9mZ_Z62QyFc52xCs',
    action: 'Next',
  },
  {
    title: 'Welcome to ManaBandhu',
    body: 'Your global community for meaningful connections and support is ready.',
    image: null,
    action: 'Get Started',
  },
] as const;

export const homeFeedFixture = [
  {
    id: 'room-1',
    title: 'Sunny room in Downtown',
    body: 'Available next month with verified host notes.',
    meta: '$850/mo',
    route: '/rooms/demo-room-1',
  },
  {
    id: 'event-1',
    title: 'Tech Meetup & Mixer',
    body: 'Sat, Oct 14 • 6:00 PM',
    meta: 'Community Event',
    route: '/events/demo-event-1',
  },
];

export const exploreCategoriesFixture = [
  {
    title: 'Daily Needs',
    items: [
      { icon: 'home', label: 'Rooms', route: '/rooms' },
      { icon: 'car', label: 'Rides', route: '/rides' },
      { icon: 'wrench', label: 'Services', route: '/search' },
      { icon: 'package', label: 'Packages', route: '/search' },
    ],
  },
  {
    title: 'Community',
    items: [
      { icon: 'community', label: 'Groups', route: '/community' },
      { icon: 'message', label: 'Chat', route: '/chat' },
      { icon: 'calendar', label: 'Events', route: '/search' },
      { icon: 'shield', label: 'Safety', route: '/search' },
    ],
  },
];

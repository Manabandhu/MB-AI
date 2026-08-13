import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const roomScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Rooms',
    title: 'Find a trusted place',
    subtitle:
      'Browse shared rooms and rentals with privacy-aware location, host signals, and saved filters.',
    metrics: [
      { label: 'Nearby listings', value: '24' },
      { label: 'Verified hosts', value: '15' },
    ],
    items: [
      {
        id: 'demo-room-1',
        title: 'Sunny private room',
        body: 'Irving · furnished · utilities included.',
        meta: '$850/mo',
        route: '/rooms/demo-room-1',
      },
      {
        id: 'demo-room-2',
        title: 'Shared apartment near transit',
        body: 'Plano · flexible lease · vegetarian household.',
        meta: '$720/mo',
        route: '/rooms/demo-room-2',
      },
    ],
  },
  search: {
    eyebrow: 'Rooms',
    title: 'Search rooms',
    subtitle:
      'Search by city, budget, move-in date, household preference, commute, and trust signals.',
    metrics: [
      { label: 'Filters', value: '9' },
      { label: 'Saved searches', value: '2' },
    ],
    items: [
      {
        id: 'budget',
        title: 'Budget range',
        body: 'Set monthly rent, utilities, deposit, and lease flexibility.',
        meta: 'Core filter',
      },
      {
        id: 'household',
        title: 'Household match',
        body: 'Find listings by lifestyle, language, food, and visitor preferences.',
        meta: 'Compatibility',
      },
    ],
  },
  map: {
    eyebrow: 'Rooms',
    title: 'Map view',
    subtitle:
      'Understand commute zones and nearby services without exposing exact private addresses.',
    metrics: [
      { label: 'Visible areas', value: '6' },
      { label: 'Transit pins', value: '12' },
    ],
    items: [
      {
        id: 'privacy',
        title: 'Approximate locations',
        body: 'Pins show general areas until a trusted contact exchange is approved.',
        meta: 'Privacy protected',
      },
      {
        id: 'commute',
        title: 'Commute overlays',
        body: 'Compare distance to work, school, groceries, temples, and transit.',
        meta: 'Coming next',
      },
    ],
  },
  filters: {
    eyebrow: 'Rooms',
    title: 'Room filters',
    subtitle:
      'Tune listings to match budget, location, household style, amenities, and safety preferences.',
    metrics: [
      { label: 'Active filters', value: '4' },
      { label: 'Matches', value: '11' },
    ],
    items: [
      {
        id: 'availability',
        title: 'Move-in window',
        body: 'This week, this month, or custom dates.',
        meta: 'Availability',
      },
      {
        id: 'amenities',
        title: 'Amenities',
        body: 'Parking, private bath, furnished, laundry, kitchen, and pets.',
        meta: 'Comfort',
      },
    ],
  },
  saved: {
    eyebrow: 'Rooms',
    title: 'Saved rooms',
    subtitle: 'Track listings you want to compare, revisit, or message about later.',
    metrics: [
      { label: 'Saved', value: '5' },
      { label: 'Price drops', value: '1' },
    ],
    items: [
      {
        id: 'demo-room-1',
        title: 'Sunny private room',
        body: 'Move-in date still matches your onboarding preferences.',
        route: '/rooms/demo-room-1',
        meta: 'Saved',
      },
    ],
  },
  'my-listings': {
    eyebrow: 'Rooms',
    title: 'My listings',
    subtitle:
      'Manage your posted rooms, availability, moderation state, and applicant conversations.',
    metrics: [
      { label: 'Active', value: '1' },
      { label: 'Drafts', value: '2' },
    ],
    items: [
      {
        id: 'draft',
        title: 'Complete your draft',
        body: 'Add photos, broad location, rent, amenities, and house rules.',
        meta: 'Draft',
      },
    ],
  },
  'create-listing': {
    eyebrow: 'Rooms',
    title: 'Create listing',
    subtitle:
      'Post a room with clear expectations, privacy-aware location, and moderation-friendly details.',
    metrics: [
      { label: 'Steps', value: '5' },
      { label: 'Required fields', value: '8' },
    ],
    items: [
      {
        id: 'basics',
        title: 'Basics',
        body: 'Rent, availability, room type, broad area, and preferred contact method.',
        meta: 'Step 1',
      },
      {
        id: 'trust',
        title: 'Trust and safety',
        body: 'House rules, verification, reporting, and contact privacy settings.',
        meta: 'Step 2',
      },
    ],
  },
  details: {
    eyebrow: 'Rooms',
    title: 'Room details',
    subtitle:
      'A focused listing page with price, availability, household fit, safety notes, and contact handoff.',
    metrics: [
      { label: 'Rent', value: '$850' },
      { label: 'Available', value: 'Sep 1' },
    ],
    items: [
      {
        id: 'summary',
        title: 'Sunny private room in Irving',
        body: 'Furnished room with utilities included and verified host signals.',
        meta: 'Broad location only',
      },
      {
        id: 'next',
        title: 'Request details',
        body: 'Ask a question or request a safe contact exchange after review.',
        meta: 'Protected handoff',
      },
    ],
  },
  edit: {
    eyebrow: 'Rooms',
    title: 'Edit listing',
    subtitle:
      'Update a room listing while preserving moderation, ownership, and location privacy boundaries.',
    metrics: [
      { label: 'Sections', value: '6' },
      { label: 'Last saved', value: 'Today' },
    ],
    items: [
      {
        id: 'pricing',
        title: 'Pricing and availability',
        body: 'Keep rent, deposit, and move-in date current.',
        meta: 'Editable',
      },
      {
        id: 'visibility',
        title: 'Visibility',
        body: 'Pause, publish, or send for moderation review.',
        meta: 'Owner only',
      },
    ],
  },
};

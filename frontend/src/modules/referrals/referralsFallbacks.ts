import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const referralsScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Referrals',
    title: 'Community referrals',
    subtitle: 'Request and offer referrals for jobs, services, and support.',
    metrics: [
      { label: 'Open', value: '8' },
      { label: 'Matches', value: '12' },
    ],
    items: [
      {
        id: 'referral-1',
        title: 'Need a plumber',
        body: 'Looking for a reliable plumber near Irving.',
        meta: 'Open',
        route: '/referrals/1',
      },
      {
        id: 'referral-2',
        title: 'Offering tutoring',
        body: 'Math and science tutoring for high schoolers.',
        meta: 'Open',
        route: '/referrals/2',
      },
    ],
  },
  request: {
    eyebrow: 'Referrals',
    title: 'Request referral',
    subtitle: 'Ask the community for a trusted referral.',
    metrics: [
      { label: 'Steps', value: '3' },
      { label: 'Required', value: 'Category, details' },
    ],
    items: [
      {
        id: 'basics',
        title: 'Basics',
        body: 'Category, urgency, and description of your need.',
        meta: 'Step 1',
      },
      {
        id: 'details',
        title: 'Details',
        body: 'Specific requirements and preferred contact method.',
        meta: 'Step 2',
      },
    ],
  },
  offer: {
    eyebrow: 'Referrals',
    title: 'Offer referral',
    subtitle: 'Offer a referral to help someone in the community.',
    metrics: [
      { label: 'Steps', value: '3' },
      { label: 'Required', value: 'Category, details' },
    ],
    items: [
      {
        id: 'basics',
        title: 'Basics',
        body: 'Category, availability, and description of what you can offer.',
        meta: 'Step 1',
      },
      {
        id: 'details',
        title: 'Details',
        body: 'Contact preferences and verification method.',
        meta: 'Step 2',
      },
    ],
  },
  'referral-details': {
    eyebrow: 'Referrals',
    title: 'Referral details',
    subtitle: 'View referral details and status.',
    metrics: [
      { label: 'Status', value: 'Open' },
      { label: 'Responses', value: '2' },
    ],
    items: [
      {
        id: 'summary',
        title: 'Need a plumber',
        body: 'Looking for a reliable plumber near Irving.',
        meta: 'Open',
      },
      {
        id: 'responses',
        title: 'Responses',
        body: 'Two community members offered referrals.',
        meta: '2 offers',
      },
    ],
  },
  mine: {
    eyebrow: 'Referrals',
    title: 'My referrals',
    subtitle: 'Your requested and offered referrals.',
    metrics: [
      { label: 'Requested', value: '3' },
      { label: 'Offered', value: '5' },
    ],
    items: [
      {
        id: 'mine-1',
        title: 'Need a plumber',
        body: 'Requested · awaiting responses',
        route: '/referrals/1',
      },
      {
        id: 'mine-2',
        title: 'Offering tutoring',
        body: 'Offered · 2 inquiries',
        route: '/referrals/2',
      },
    ],
  },
};

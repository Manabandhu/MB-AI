import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type { BlockedUserItem, ReportItem, TrustedContactItem } from '@/modules/safety/api';

export const safetyCenterFallback: CatalogScreenContent = {
  eyebrow: 'Safety',
  title: 'Safety center',
  subtitle: 'Tools and resources to keep your interactions respectful, private, and accountable.',
  metrics: [
    { label: 'Active reports', value: '2' },
    { label: 'Blocked users', value: '1' },
  ],
  items: [
    {
      id: 'reports',
      title: 'Reports',
      body: 'View and file safety reports with timestamps and evidence notes.',
      meta: '2 open',
      route: '/safety/reports',
    },
    {
      id: 'blocked-users',
      title: 'Blocked users',
      body: 'Manage users you have blocked and review reasons.',
      meta: '1 blocked',
      route: '/safety/blocked-users',
    },
    {
      id: 'trusted-contacts',
      title: 'Trusted contacts',
      body: 'Add family or friends as trusted contacts for escalation.',
      meta: '3 contacts',
      route: '/safety/trusted-contacts',
    },
  ],
};

export const reportsFallback: ReportItem[] = [
  {
    id: 'report-1',
    title: 'Inappropriate message',
    body: 'User sent unwanted promotional content in a community group.',
    meta: '2 hours ago',
    status: 'open',
  },
  {
    id: 'report-2',
    title: 'False listing details',
    body: 'Room listing did not match the photos or shared amenities.',
    meta: '1 day ago',
    status: 'reviewing',
  },
  {
    id: 'report-3',
    title: 'Harassment during ride',
    body: 'Passenger reported uncomfortable behavior from driver.',
    meta: '3 days ago',
    status: 'resolved',
  },
];

export const blockedUsersFallback: BlockedUserItem[] = [
  {
    id: 'user-1',
    name: 'Jordan Smith',
    initials: 'JS',
    reason: 'Repeated unwanted contact after block request',
    blockedAt: 'Aug 20, 2026',
  },
];

export const trustedContactsFallback: TrustedContactItem[] = [
  {
    id: 'contact-1',
    name: 'Priya Patel',
    initials: 'PP',
    relationship: 'Sister',
    addedAt: 'Jul 10, 2026',
  },
  {
    id: 'contact-2',
    name: 'Ravi Kumar',
    initials: 'RK',
    relationship: 'Friend',
    addedAt: 'Aug 02, 2026',
  },
  {
    id: 'contact-3',
    name: 'Anita Sharma',
    initials: 'AS',
    relationship: 'Parent',
    addedAt: 'Aug 15, 2026',
  },
];

import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';
import type { EmergencyItem, NearbyItem, PackageItem } from '@/modules/utilities/api';

export const utilitiesHomeFallback: CatalogScreenContent = {
  eyebrow: 'Utilities',
  title: 'Everyday helpers',
  subtitle: 'Package tracking, nearby services, and emergency resources in one place.',
  metrics: [
    { label: 'Active packages', value: '2' },
    { label: 'Nearby services', value: '8' },
  ],
  items: [
    {
      id: 'packages',
      title: 'Package tracking',
      body: 'Track deliveries and get status updates.',
      meta: '2 in transit',
      route: '/utilities/packages',
    },
    {
      id: 'nearby',
      title: 'Nearby',
      body: 'Find grocery stores, clinics, transit, and worship centers.',
      meta: '8 nearby',
      route: '/utilities/nearby',
    },
    {
      id: 'emergency',
      title: 'Emergency resources',
      body: 'Quick access to crisis lines, shelters, and legal aid.',
      meta: 'Always available',
      route: '/utilities/emergency',
    },
  ],
};

export const packagesFallback: PackageItem[] = [
  {
    id: 'pkg-1',
    title: 'Amazon delivery',
    body: 'Arriving today between 2 PM - 6 PM',
    meta: 'DFW Distribution Center',
    status: 'In transit',
  },
  {
    id: 'pkg-2',
    title: 'Pharmacy prescription',
    body: 'Ready for pickup at Walgreens on Belt Line Rd',
    meta: 'Track #RX-44921',
    status: 'Ready',
  },
];

export const nearbyFallback: NearbyItem[] = [
  {
    id: 'place-1',
    title: 'Indian grocery store',
    body: 'Fresh produce, spices, and ready-to-eat items',
    meta: '0.8 mi',
    distance: '0.8 mi',
  },
  {
    id: 'place-2',
    title: 'Urgent care clinic',
    body: 'Walk-ins welcome, open until 9 PM',
    meta: '1.4 mi',
    distance: '1.4 mi',
  },
];

export const emergencyFallback: EmergencyItem[] = [
  {
    id: 'em-1',
    title: 'Crisis helpline',
    body: '24/7 confidential support for mental health and safety',
    meta: '988 Suicide & Crisis Lifeline',
    actionLabel: 'Call now',
  },
  {
    id: 'em-2',
    title: 'Domestic violence shelter',
    body: 'Safe housing, legal aid, and case management',
    meta: 'Dallas County',
    actionLabel: 'Get directions',
  },
  {
    id: 'em-3',
    title: 'Immigration legal aid',
    body: 'Free consultations and form assistance',
    meta: 'IRCA Dallas',
    actionLabel: 'Learn more',
  },
];

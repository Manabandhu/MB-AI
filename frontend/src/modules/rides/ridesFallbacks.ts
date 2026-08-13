import type { CatalogScreenContent } from '@/modules/foundation/screenDataTypes';

export const rideScreenFallbacks: Record<string, CatalogScreenContent> = {
  home: {
    eyebrow: 'Rides',
    title: 'Go together safely',
    subtitle:
      'Find airport rides, local trips, commute matches, and community offers with clear seat and safety state.',
    metrics: [
      { label: 'Open rides', value: '18' },
      { label: 'Seats', value: '42' },
    ],
    items: [
      {
        id: 'airport',
        title: 'DFW airport ride',
        body: 'Saturday · 8:30 AM · two seats open.',
        meta: '$18 contribution',
      },
      {
        id: 'grocery',
        title: 'Grocery run',
        body: 'Plano to Patel Brothers this evening.',
        meta: 'Local trip',
      },
    ],
  },
  search: {
    eyebrow: 'Rides',
    title: 'Search rides',
    subtitle:
      'Find rides by pickup area, destination, time window, seats, contribution, and driver trust signals.',
    metrics: [
      { label: 'Filters', value: '8' },
      { label: 'Saved searches', value: '3' },
    ],
    items: [
      {
        id: 'route',
        title: 'Route and time',
        body: 'Search by broad pickup area, destination, and flexible departure time.',
        meta: 'Core filter',
      },
      {
        id: 'seats',
        title: 'Seats and luggage',
        body: 'Match capacity, luggage, child seat, and contribution expectations.',
        meta: 'Trip fit',
      },
    ],
  },
  map: {
    eyebrow: 'Rides',
    title: 'Ride map',
    subtitle: 'See pickup and drop-off areas with privacy-preserving location approximations.',
    metrics: [
      { label: 'Pickup zones', value: '5' },
      { label: 'Routes', value: '9' },
    ],
    items: [
      {
        id: 'zones',
        title: 'Approximate pickup zones',
        body: 'Exact pickup is shared only after a ride request is accepted.',
        meta: 'Privacy protected',
      },
      {
        id: 'routes',
        title: 'Common routes',
        body: 'Airport, campuses, grocery corridors, and commute paths.',
        meta: 'Discovery',
      },
    ],
  },
  filters: {
    eyebrow: 'Rides',
    title: 'Ride filters',
    subtitle:
      'Narrow ride discovery by schedule, seats, safety preference, contribution, and pickup flexibility.',
    metrics: [
      { label: 'Active filters', value: '3' },
      { label: 'Matches', value: '8' },
    ],
    items: [
      {
        id: 'time',
        title: 'Departure window',
        body: 'Morning, afternoon, evening, or custom trip windows.',
        meta: 'Timing',
      },
      {
        id: 'safety',
        title: 'Safety preferences',
        body: 'Verified drivers, known communities, ratings, and shared trip status.',
        meta: 'Safety',
      },
    ],
  },
  offer: {
    eyebrow: 'Rides',
    title: 'Offer a ride',
    subtitle:
      'Post a ride with route, time, seats, contribution, luggage, and safe contact expectations.',
    metrics: [
      { label: 'Steps', value: '4' },
      { label: 'Required fields', value: '7' },
    ],
    items: [
      {
        id: 'trip',
        title: 'Trip basics',
        body: 'Pickup area, destination, date, time, seats, and route flexibility.',
        meta: 'Step 1',
      },
      {
        id: 'safety',
        title: 'Safety and visibility',
        body: 'Set who can request, confirmation flow, and trip sharing options.',
        meta: 'Step 2',
      },
    ],
  },
};

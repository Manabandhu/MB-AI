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
      {
        id: 'commute',
        title: 'Daily commute',
        body: 'Richardson to Dallas · weekdays · 7:30 AM.',
        meta: '$12 contribution',
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
      {
        id: 'driver',
        title: 'Driver preferences',
        body: 'Verified drivers, ratings, and community connections.',
        meta: 'Trust',
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
      {
        id: 'hotspots',
        title: 'Ride hotspots',
        body: 'Popular pickup areas with frequent ride matches.',
        meta: 'Activity',
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
      {
        id: 'contribution',
        title: 'Contribution range',
        body: 'Set minimum and maximum contribution expectations.',
        meta: 'Budget',
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
      {
        id: 'review',
        title: 'Review and publish',
        body: 'Confirm details and publish your ride offer.',
        meta: 'Step 3',
      },
    ],
  },
  request: {
    eyebrow: 'Rides',
    title: 'Request a ride',
    subtitle: 'Request a ride by describing your route, timing, and seat needs.',
    metrics: [
      { label: 'Steps', value: '3' },
      { label: 'Required fields', value: '5' },
    ],
    items: [
      {
        id: 'route',
        title: 'Route and time',
        body: 'Pickup area, destination, date, and time.',
        meta: 'Step 1',
      },
      {
        id: 'needs',
        title: 'Seat and luggage',
        body: 'Number of seats, luggage, and special requirements.',
        meta: 'Step 2',
      },
      {
        id: 'review',
        title: 'Review and request',
        body: 'Confirm details and submit your ride request.',
        meta: 'Step 3',
      },
    ],
  },
  saved: {
    eyebrow: 'Rides',
    title: 'Saved rides',
    subtitle: 'Track rides you want to revisit or request later.',
    metrics: [
      { label: 'Saved', value: '4' },
      { label: 'Upcoming', value: '2' },
    ],
    items: [
      {
        id: 'demo-ride-1',
        title: 'DFW airport ride',
        body: 'Saturday · 8:30 AM · two seats open.',
        route: '/rides/demo-ride-1',
        meta: 'Saved',
      },
      {
        id: 'demo-ride-2',
        title: 'Daily commute',
        body: 'Weekdays · 7:30 AM · Richardson to Dallas.',
        route: '/rides/demo-ride-2',
        meta: 'Saved',
      },
    ],
  },
  mine: {
    eyebrow: 'Rides',
    title: 'My rides',
    subtitle: 'Manage your offered rides, seat requests, and rider conversations.',
    metrics: [
      { label: 'Active', value: '2' },
      { label: 'Pending requests', value: '5' },
    ],
    items: [
      {
        id: 'demo-ride-1',
        title: 'DFW airport ride',
        body: 'Saturday · 8:30 AM · 2 seat requests pending.',
        route: '/rides/demo-ride-1/manage',
        meta: 'Active',
      },
      {
        id: 'demo-ride-2',
        title: 'Daily commute',
        body: 'Weekdays · 7:30 AM · 3 regular riders.',
        route: '/rides/demo-ride-2/manage',
        meta: 'Active',
      },
    ],
  },
  history: {
    eyebrow: 'Rides',
    title: 'Ride history',
    subtitle: 'View past rides and rate your experiences.',
    metrics: [
      { label: 'Completed', value: '12' },
      { label: 'Rated', value: '9' },
    ],
    items: [
      {
        id: 'demo-ride-3',
        title: 'Grocery run',
        body: 'Completed 2 days ago · Plano to Patel Brothers.',
        route: '/rides/demo-ride-3/rate',
        meta: 'Completed',
      },
      {
        id: 'demo-ride-4',
        title: 'Airport drop-off',
        body: 'Completed last week · DFW airport.',
        route: '/rides/demo-ride-4/rate',
        meta: 'Completed',
      },
    ],
  },
  details: {
    eyebrow: 'Rides',
    title: 'Ride details',
    subtitle:
      'A focused ride page with route, timeline, seat state, safety controls, and participant info.',
    metrics: [
      { label: 'Seats open', value: '2' },
      { label: 'Contribution', value: '$18' },
    ],
    items: [
      {
        id: 'summary',
        title: 'DFW airport ride',
        body: 'Saturday morning ride with verified driver and two open seats.',
        meta: 'Active',
      },
      {
        id: 'route',
        title: 'Route',
        body: 'Plano to DFW Airport · approximate pickup shared after acceptance.',
        meta: 'Privacy protected',
      },
      {
        id: 'safety',
        title: 'Safety',
        body: 'Verified driver, trip sharing enabled, and community reviews.',
        meta: 'Safety',
      },
    ],
  },
  manage: {
    eyebrow: 'Rides',
    title: 'Manage ride',
    subtitle: 'Update ride status, seats, visibility, and safety controls.',
    metrics: [
      { label: 'Pending requests', value: '3' },
      { label: 'Confirmed', value: '1' },
    ],
    items: [
      {
        id: 'status',
        title: 'Ride status',
        body: 'Active, paused, or completed.',
        meta: 'Editable',
      },
      {
        id: 'seats',
        title: 'Seats and contribution',
        body: 'Update open seats and contribution amount.',
        meta: 'Editable',
      },
      {
        id: 'visibility',
        title: 'Visibility',
        body: 'Control who can see and request your ride.',
        meta: 'Owner only',
      },
    ],
  },
  'seat-requests': {
    eyebrow: 'Rides',
    title: 'Seat requests',
    subtitle: 'Review and manage seat requests for your ride.',
    metrics: [
      { label: 'Pending', value: '3' },
      { label: 'Approved', value: '1' },
    ],
    items: [
      {
        id: 'request-1',
        title: 'Anya P.',
        body: 'Plano pickup · 1 seat · community member.',
        meta: 'Pending',
      },
      {
        id: 'request-2',
        title: 'Raj K.',
        body: 'Irving pickup · 1 seat · verified rider.',
        meta: 'Pending',
      },
    ],
  },
  participants: {
    eyebrow: 'Rides',
    title: 'Participants',
    subtitle: 'View confirmed participants and trip sharing status.',
    metrics: [
      { label: 'Confirmed', value: '2' },
      { label: 'Trip shared', value: '1' },
    ],
    items: [
      {
        id: 'participant-1',
        title: 'Driver · You',
        body: 'Verified driver with trip sharing enabled.',
        meta: 'Host',
      },
      {
        id: 'participant-2',
        title: 'Priya S.',
        body: 'Confirmed rider · trip shared with trusted contact.',
        meta: 'Rider',
      },
    ],
  },
  rate: {
    eyebrow: 'Rides',
    title: 'Rate ride',
    subtitle: 'Share feedback on safety, timeliness, and comfort.',
    metrics: [
      { label: 'Completed', value: '1' },
      { label: 'Pending rating', value: '1' },
    ],
    items: [
      {
        id: 'safety',
        title: 'Safety',
        body: 'Rate the driver safety and vehicle condition.',
        meta: 'Rating',
      },
      {
        id: 'timeliness',
        title: 'Timeliness',
        body: 'Rate pickup and drop-off timeliness.',
        meta: 'Rating',
      },
      {
        id: 'comfort',
        title: 'Comfort',
        body: 'Rate ride comfort and communication.',
        meta: 'Rating',
      },
    ],
  },
};

import type { Event } from '@/modules/events/api';

export type EventsScreenContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  metrics?: { label: string; value: string }[];
  events?: Event[];
};

export const eventsScreenFallbacks: Record<string, EventsScreenContent> = {
  home: {
    eyebrow: 'Events',
    title: 'Discover events',
    subtitle: 'Find meetups, workshops, and community gatherings near you.',
    metrics: [
      { label: 'This week', value: '24' },
      { label: 'Saved', value: '5' },
    ],
    events: [
      {
        id: 'ev1',
        title: 'Community Meetup',
        description: 'Monthly gathering for neighbors.',
        date: '2025-06-01',
        location: 'Dallas',
        organizer: 'Ravi',
        category: 'Social',
        attendeeCount: 120,
        isSaved: true,
      },
      {
        id: 'ev2',
        title: 'Resume Workshop',
        description: 'Build your resume with local mentors.',
        date: '2025-06-05',
        location: 'Plano',
        organizer: 'Priya',
        category: 'Career',
        attendeeCount: 45,
        isSaved: false,
      },
      {
        id: 'ev3',
        title: 'Potluck Lunch',
        description: 'Bring a dish and meet new friends.',
        date: '2025-06-10',
        location: 'Irving',
        organizer: 'Sam',
        category: 'Social',
        attendeeCount: 80,
        isSaved: false,
      },
    ],
  },
  search: {
    eyebrow: 'Search',
    title: 'Search events',
    subtitle: 'Find events by name, location, or category.',
    metrics: [
      { label: 'Results', value: '18' },
      { label: 'Categories', value: '6' },
    ],
    events: [
      {
        id: 'ev1',
        title: 'Community Meetup',
        description: 'Monthly gathering for neighbors.',
        date: '2025-06-01',
        location: 'Dallas',
        organizer: 'Ravi',
        category: 'Social',
        attendeeCount: 120,
        isSaved: true,
      },
      {
        id: 'ev2',
        title: 'Resume Workshop',
        description: 'Build your resume with local mentors.',
        date: '2025-06-05',
        location: 'Plano',
        organizer: 'Priya',
        category: 'Career',
        attendeeCount: 45,
        isSaved: false,
      },
    ],
  },
  details: {
    eyebrow: 'Event',
    title: 'Community Meetup',
    subtitle: 'Monthly gathering for neighbors.',
    metrics: [
      { label: 'Attendees', value: '120' },
      { label: 'Date', value: 'Jun 1, 2025' },
    ],
    events: [],
  },
  create: {
    eyebrow: 'Create Event',
    title: 'Host an event',
    subtitle: 'Plan and publish a new community event.',
    metrics: [],
    events: [],
  },
  saved: {
    eyebrow: 'Saved',
    title: 'Saved events',
    subtitle: 'Events you want to attend later.',
    metrics: [
      { label: 'Saved', value: '5' },
      { label: 'Upcoming', value: '2' },
    ],
    events: [
      {
        id: 'ev1',
        title: 'Community Meetup',
        description: 'Monthly gathering for neighbors.',
        date: '2025-06-01',
        location: 'Dallas',
        organizer: 'Ravi',
        category: 'Social',
        attendeeCount: 120,
        isSaved: true,
      },
    ],
  },
  mine: {
    eyebrow: 'My Events',
    title: 'My events',
    subtitle: 'Events you are hosting or attending.',
    metrics: [
      { label: 'Hosting', value: '2' },
      { label: 'Attending', value: '3' },
    ],
    events: [
      {
        id: 'ev1',
        title: 'Community Meetup',
        description: 'Monthly gathering for neighbors.',
        date: '2025-06-01',
        location: 'Dallas',
        organizer: 'Ravi',
        category: 'Social',
        attendeeCount: 120,
        isSaved: true,
      },
      {
        id: 'ev2',
        title: 'Resume Workshop',
        description: 'Build your resume with local mentors.',
        date: '2025-06-05',
        location: 'Plano',
        organizer: 'Priya',
        category: 'Career',
        attendeeCount: 45,
        isSaved: false,
      },
    ],
  },
};

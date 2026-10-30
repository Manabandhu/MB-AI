import { CommunityHomeWidget } from '@/modules/community';
import { EventsHomeWidget } from '@/modules/events';
import { JobsHomeWidget } from '@/modules/jobs';
import { ReferralsHomeWidget } from '@/modules/referrals';
import { RidesHomeWidget } from '@/modules/rides';
import { RoomsHomeWidget } from '@/modules/rooms';
import type { HomeWidget } from './types';

/** Home widget order. Each entry comes from a module's public `index.ts`; add, remove, or reorder here only. */
export const homeWidgets: readonly HomeWidget[] = [
  { id: 'rooms', Component: RoomsHomeWidget },
  { id: 'rides', Component: RidesHomeWidget },
  { id: 'community', Component: CommunityHomeWidget },
  { id: 'jobs', Component: JobsHomeWidget },
  { id: 'events', Component: EventsHomeWidget },
  { id: 'referrals', Component: ReferralsHomeWidget },
];

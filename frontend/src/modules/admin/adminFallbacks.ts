import type {
  AdminCommunityPost,
  AdminEvent,
  AdminJob,
  AdminReport,
  AdminRide,
  AdminRoom,
  AdminUser,
  AuditLogEntry,
} from '@/modules/admin/api';

export type AdminScreenContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  metrics?: { label: string; value: string }[];
  users?: AdminUser[];
  reports?: AdminReport[];
  rooms?: AdminRoom[];
  rides?: AdminRide[];
  communityPosts?: AdminCommunityPost[];
  jobs?: AdminJob[];
  events?: AdminEvent[];
  auditLog?: AuditLogEntry[];
};

export const adminScreenFallbacks: Record<string, AdminScreenContent> = {
  dashboard: {
    eyebrow: 'Admin',
    title: 'Dashboard',
    subtitle: 'Platform overview and key metrics.',
    metrics: [
      { label: 'Total Users', value: '12,450' },
      { label: 'Active Now', value: '342' },
      { label: 'Reports', value: '18' },
      { label: 'Pending Reviews', value: '7' },
    ],
  },
  users: {
    eyebrow: 'Admin',
    title: 'Users',
    subtitle: 'Manage user accounts and permissions.',
    metrics: [{ label: 'Total', value: '12,450' }],
    users: [
      {
        id: 'u1',
        name: 'Ravi Kumar',
        email: 'ravi@example.com',
        role: 'User',
        status: 'Active',
        createdAt: '2025-01-15',
      },
      {
        id: 'u2',
        name: 'Priya Sharma',
        email: 'priya@example.com',
        role: 'User',
        status: 'Active',
        createdAt: '2025-02-20',
      },
      {
        id: 'u3',
        name: 'Sam Patel',
        email: 'sam@example.com',
        role: 'Moderator',
        status: 'Active',
        createdAt: '2025-03-10',
      },
      {
        id: 'u4',
        name: 'Anita Singh',
        email: 'anita@example.com',
        role: 'User',
        status: 'Suspended',
        createdAt: '2025-04-05',
      },
    ],
  },
  reports: {
    eyebrow: 'Admin',
    title: 'Reports',
    subtitle: 'Review and resolve user reports.',
    metrics: [{ label: 'Open', value: '18' }],
    reports: [
      {
        id: 'r1',
        type: 'Spam',
        targetId: 'p1',
        targetType: 'Post',
        reporterName: 'Ravi',
        reason: 'Spam content',
        status: 'Open',
        createdAt: '2025-05-01',
      },
      {
        id: 'r2',
        type: 'Harassment',
        targetId: 'c1',
        targetType: 'Comment',
        reporterName: 'Priya',
        reason: 'Unwanted messages',
        status: 'Open',
        createdAt: '2025-05-02',
      },
      {
        id: 'r3',
        type: 'Fraud',
        targetId: 'room1',
        targetType: 'Listing',
        reporterName: 'Sam',
        reason: 'Fake listing',
        status: 'Resolved',
        createdAt: '2025-04-28',
      },
    ],
  },
  rooms: {
    eyebrow: 'Admin',
    title: 'Rooms',
    subtitle: 'Moderate room listings.',
    metrics: [{ label: 'Listings', value: '1,240' }],
    rooms: [
      {
        id: 'room1',
        title: 'Sunny private room',
        hostName: 'Ravi',
        status: 'Active',
        reported: false,
        createdAt: '2025-01-20',
      },
      {
        id: 'room2',
        title: 'Shared apartment',
        hostName: 'Priya',
        status: 'Pending',
        reported: true,
        createdAt: '2025-02-15',
      },
    ],
  },
  rides: {
    eyebrow: 'Admin',
    title: 'Rides',
    subtitle: 'Moderate ride listings.',
    metrics: [{ label: 'Rides', value: '856' }],
    rides: [
      {
        id: 'ride1',
        from: 'Dallas',
        to: 'Austin',
        driverName: 'Sam',
        status: 'Active',
        reported: false,
        createdAt: '2025-03-01',
      },
      {
        id: 'ride2',
        from: 'Houston',
        to: 'San Antonio',
        driverName: 'Anita',
        status: 'Pending',
        reported: true,
        createdAt: '2025-03-10',
      },
    ],
  },
  community: {
    eyebrow: 'Admin',
    title: 'Community',
    subtitle: 'Moderate community content.',
    metrics: [{ label: 'Posts', value: '3,420' }],
    communityPosts: [
      {
        id: 'p1',
        communityName: 'DFW Desi',
        authorName: 'Ravi',
        title: 'Welcome post',
        status: 'Active',
        reported: false,
        createdAt: '2025-04-01',
      },
      {
        id: 'p2',
        communityName: 'Immigration Help',
        authorName: 'Sam',
        title: 'Visa tips',
        status: 'Flagged',
        reported: true,
        createdAt: '2025-04-15',
      },
    ],
  },
  jobs: {
    eyebrow: 'Admin',
    title: 'Jobs',
    subtitle: 'Moderate job postings.',
    metrics: [{ label: 'Jobs', value: '640' }],
    jobs: [
      {
        id: 'job1',
        title: 'Software Engineer',
        company: 'TechCorp',
        status: 'Active',
        reported: false,
        createdAt: '2025-05-01',
      },
      {
        id: 'job2',
        title: 'Delivery Driver',
        company: 'FastShip',
        status: 'Pending',
        reported: true,
        createdAt: '2025-05-05',
      },
    ],
  },
  events: {
    eyebrow: 'Admin',
    title: 'Events',
    subtitle: 'Moderate events.',
    metrics: [{ label: 'Events', value: '210' }],
    events: [
      {
        id: 'ev1',
        title: 'Community Meetup',
        organizer: 'Ravi',
        date: '2025-06-01',
        status: 'Active',
        reported: false,
        createdAt: '2025-05-10',
      },
      {
        id: 'ev2',
        title: 'Job Fair',
        organizer: 'Priya',
        date: '2025-06-15',
        status: 'Pending',
        reported: true,
        createdAt: '2025-05-12',
      },
    ],
  },
  'audit-log': {
    eyebrow: 'Admin',
    title: 'Audit Log',
    subtitle: 'System activity and changes.',
    metrics: [{ label: 'Entries', value: '8,900' }],
    auditLog: [
      {
        id: 'a1',
        actor: 'admin',
        action: 'user.suspend',
        targetType: 'User',
        targetId: 'u4',
        createdAt: '2025-05-01T10:00:00Z',
      },
      {
        id: 'a2',
        actor: 'moderator',
        action: 'post.approve',
        targetType: 'Post',
        targetId: 'p1',
        createdAt: '2025-05-02T11:30:00Z',
      },
      {
        id: 'a3',
        actor: 'admin',
        action: 'listing.remove',
        targetType: 'Room',
        targetId: 'room2',
        createdAt: '2025-05-03T09:15:00Z',
      },
    ],
  },
};

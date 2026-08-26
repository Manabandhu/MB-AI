import type { Post } from '@/modules/community/api';

export type CommunityScreenContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  metrics?: { label: string; value: string }[];
  communities?: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    route: string;
  }[];
  posts?: Post[];
};

export const communityScreenFallbacks: Record<string, CommunityScreenContent> = {
  home: {
    eyebrow: 'Community',
    title: 'Your communities',
    subtitle: 'Stay connected with the communities you care about.',
    metrics: [
      { label: 'Joined', value: '3' },
      { label: 'Unread posts', value: '12' },
    ],
    communities: [
      {
        id: 'c1',
        name: 'DFW Desi Network',
        description: 'Local support and meetups.',
        memberCount: 1240,
        route: '/community/c1',
      },
      {
        id: 'c2',
        name: 'Immigration Help',
        description: 'Visa and documentation guidance.',
        memberCount: 856,
        route: '/community/c2',
      },
      {
        id: 'c3',
        name: 'Carpool Dallas',
        description: 'Ride sharing and commutes.',
        memberCount: 430,
        route: '/community/c3',
      },
    ],
  },
  discover: {
    eyebrow: 'Discover',
    title: 'Find communities',
    subtitle: 'Explore groups that match your interests and location.',
    metrics: [
      { label: 'Communities', value: '48' },
      { label: 'Near you', value: '6' },
    ],
    communities: [
      {
        id: 'c1',
        name: 'DFW Desi Network',
        description: 'Local support and meetups.',
        memberCount: 1240,
        route: '/community/c1',
      },
      {
        id: 'c4',
        name: 'Austin Techies',
        description: 'Tech jobs and events.',
        memberCount: 2100,
        route: '/community/c4',
      },
      {
        id: 'c5',
        name: 'Houston Garden Club',
        description: 'Gardening tips and swaps.',
        memberCount: 320,
        route: '/community/c5',
      },
      {
        id: 'c6',
        name: 'San Antonio Students',
        description: 'Study groups and resources.',
        memberCount: 890,
        route: '/community/c6',
      },
    ],
  },
  joined: {
    eyebrow: 'Joined',
    title: 'Your joined communities',
    subtitle: 'Quick access to your active groups.',
    metrics: [
      { label: 'Joined', value: '3' },
      { label: 'Active today', value: '2' },
    ],
    communities: [
      {
        id: 'c1',
        name: 'DFW Desi Network',
        description: 'Local support and meetups.',
        memberCount: 1240,
        route: '/community/c1',
      },
      {
        id: 'c2',
        name: 'Immigration Help',
        description: 'Visa and documentation guidance.',
        memberCount: 856,
        route: '/community/c2',
      },
      {
        id: 'c3',
        name: 'Carpool Dallas',
        description: 'Ride sharing and commutes.',
        memberCount: 430,
        route: '/community/c3',
      },
    ],
  },
  details: {
    eyebrow: 'Community',
    title: 'DFW Desi Network',
    subtitle: 'Local support and meetups for the DFW area.',
    metrics: [
      { label: 'Members', value: '1,240' },
      { label: 'Posts today', value: '18' },
    ],
    communities: [],
  },
  'create-post': {
    eyebrow: 'Create Post',
    title: 'Share with your community',
    subtitle: 'Write a post, ask a question, or share an update.',
    metrics: [],
    communities: [],
  },
  'post-details': {
    eyebrow: 'Post',
    title: 'Sample post title',
    subtitle: 'Posted by Demo User',
    metrics: [],
    posts: [
      {
        id: 'p1',
        communityId: 'c1',
        authorName: 'Demo User',
        title: 'Welcome to the community!',
        body: 'This is a sample post to demonstrate the post details screen.',
        createdAt: new Date().toISOString(),
        commentCount: 3,
        likeCount: 12,
      },
    ],
  },
};

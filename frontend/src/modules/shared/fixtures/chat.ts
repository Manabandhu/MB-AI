export const chatFixtures = {
  conversations: [
    {
      id: 'conv1',
      title: 'Priya S.',
      body: 'Are you still looking for a roommate?',
      meta: '2m ago',
      avatarInitials: 'PS',
    },
    {
      id: 'conv2',
      title: 'Rides Group',
      body: 'Rahul: Leaving in 10 mins.',
      meta: '1h ago',
      avatarInitials: 'RG',
    },
    {
      id: 'conv3',
      title: 'Support',
      body: 'Your issue has been resolved.',
      meta: '3h ago',
      avatarInitials: 'SU',
    },
  ],
  messages: [
    { id: 'm1', body: 'Hi, I saw your room listing.', time: '10:00 AM', sent: true },
    { id: 'm2', body: 'Yes, it is still available.', time: '10:02 AM', sent: false },
    { id: 'm3', body: 'Can I schedule a visit?', time: '10:05 AM', sent: true },
    { id: 'm4', body: 'Sure, how about Saturday?', time: '10:07 AM', sent: false },
  ],
};

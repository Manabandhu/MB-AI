export const adminFixtures = {
  metrics: [
    { label: 'Users', value: '1,240' },
    { label: 'Reports', value: '18' },
    { label: 'Moderation', value: '7' },
  ],
  sections: [
    {
      title: 'Pending Reviews',
      items: [
        { id: 'ad1', title: 'Room listing flagged', body: 'User: Rahul', meta: '2m ago' },
        { id: 'ad2', title: 'Post report', body: 'User: Priya', meta: '15m ago' },
      ],
    },
    {
      title: 'Recent Activity',
      items: [
        { id: 'ad3', title: 'New signups', body: '12 users today', meta: 'Today' },
        { id: 'ad4', title: 'System health', body: 'All services operational', meta: 'Updated' },
      ],
    },
  ],
};

export const safetyFixtures = {
  metrics: [
    { label: 'Reports', value: '2' },
    { label: 'Blocked', value: '1' },
    { label: 'Trusted Contacts', value: '3' },
  ],
  cards: [
    {
      id: 's1',
      title: 'Report a Concern',
      body: 'File a safety or community concern.',
      meta: 'Action',
    },
    {
      id: 's2',
      title: 'Blocked Users',
      body: 'Manage users you have blocked.',
      meta: '1 blocked',
    },
    {
      id: 's3',
      title: 'Trusted Contacts',
      body: 'Add contacts for safety alerts.',
      meta: '3 contacts',
    },
  ],
};

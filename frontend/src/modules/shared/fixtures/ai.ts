export const aiFixtures = {
  messages: [
    { id: 'a1', body: 'Hello! How can I help you today?', time: '10:00 AM', sent: false },
    { id: 'a2', body: 'I need help finding a room.', time: '10:01 AM', sent: true },
    {
      id: 'a3',
      body: 'Sure, what is your budget and preferred area?',
      time: '10:02 AM',
      sent: false,
    },
  ],
  suggestions: ['Search rooms near downtown', 'Filter by price range', 'Save listings for later'],
};

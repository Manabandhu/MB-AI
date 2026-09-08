import type {
  AssistantCitation,
  AssistantConversation,
  AssistantMessage,
} from '@/modules/ai-assistant/api';

export const assistantScreenFallbacks = {
  messages: [
    {
      id: 'msg-1',
      body: 'Hello! I am your ManaBandhu assistant. How can I help you today?',
      time: '10:30 AM',
      sent: false,
    },
    {
      id: 'msg-2',
      body: 'I need help finding a room near DFW with vegetarian-friendly roommates.',
      time: '10:31 AM',
      sent: true,
    },
    {
      id: 'msg-3',
      body: 'I found 3 matches. Would you like me to summarize trust signals and commute times?',
      time: '10:31 AM',
      sent: false,
    },
  ] satisfies AssistantMessage[],
  history: [
    {
      id: 'conv-1',
      title: 'Room search near DFW',
      body: 'Discussed budget, move-in date, and household preferences.',
      meta: 'Yesterday',
      route: '/assistant',
    },
    {
      id: 'conv-2',
      title: 'Ride to temple',
      body: 'Found carpools for Sunday morning from Irving.',
      meta: '3 days ago',
      route: '/assistant',
    },
  ] satisfies AssistantConversation[],
  citations: [
    {
      id: 'cite-1',
      title: 'Community guidelines',
      body: 'Respectful communication, privacy boundaries, and moderation rules.',
      meta: 'Manabandhu handbook',
      source: 'app://handbook',
    },
    {
      id: 'cite-2',
      title: 'Trust and safety FAQ',
      body: 'How reporting, blocking, and trusted contacts work.',
      meta: 'Help center',
      source: 'app://help',
    },
  ] satisfies AssistantCitation[],
};

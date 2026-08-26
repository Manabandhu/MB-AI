import type { Conversation, Message, Participant } from '@/modules/chat/api';

export type ChatScreenContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  conversations?: Conversation[];
  messages?: Message[];
  participants?: Participant[];
};

export const chatScreenFallbacks: Record<string, ChatScreenContent> = {
  home: {
    eyebrow: 'Chat',
    title: 'Messages',
    subtitle: 'Stay in touch with your connections.',
    conversations: [
      {
        id: 'conv1',
        title: 'Ride to Austin',
        lastMessage: 'Leaving at 7am tomorrow.',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 2,
        participants: [
          { id: 'u1', name: 'Ravi', role: 'Member' },
          { id: 'u2', name: 'You', role: 'Member' },
        ],
      },
      {
        id: 'conv2',
        title: 'Roommate chat',
        lastMessage: 'Groceries done.',
        lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
        unreadCount: 0,
        participants: [
          { id: 'u3', name: 'Priya', role: 'Member' },
          { id: 'u2', name: 'You', role: 'Member' },
        ],
      },
      {
        id: 'conv3',
        title: 'Immigration Help',
        lastMessage: 'Can you review my docs?',
        lastMessageAt: new Date(Date.now() - 172800000).toISOString(),
        unreadCount: 1,
        participants: [
          { id: 'u4', name: 'Sam', role: 'Member' },
          { id: 'u2', name: 'You', role: 'Member' },
        ],
      },
    ],
  },
  new: {
    eyebrow: 'New Chat',
    title: 'Start a conversation',
    subtitle: 'Pick someone to message.',
    conversations: [],
  },
  conversation: {
    eyebrow: 'Chat',
    title: 'Ride to Austin',
    subtitle: 'Ravi',
    messages: [
      {
        id: 'm1',
        conversationId: 'conv1',
        senderId: 'u1',
        senderName: 'Ravi',
        body: 'Hey! Are we still on for tomorrow?',
        createdAt: new Date().toISOString(),
        sent: false,
      },
      {
        id: 'm2',
        conversationId: 'conv1',
        senderId: 'u2',
        senderName: 'You',
        body: 'Yes, leaving at 7am.',
        createdAt: new Date().toISOString(),
        sent: true,
      },
      {
        id: 'm3',
        conversationId: 'conv1',
        senderId: 'u1',
        senderName: 'Ravi',
        body: 'Perfect, see you then.',
        createdAt: new Date().toISOString(),
        sent: false,
      },
    ],
    participants: [
      { id: 'u1', name: 'Ravi', role: 'Member' },
      { id: 'u2', name: 'You', role: 'Member' },
    ],
  },
  info: {
    eyebrow: 'Conversation Info',
    title: 'Ride to Austin',
    subtitle: 'Conversation details',
    participants: [
      { id: 'u1', name: 'Ravi', role: 'Admin' },
      { id: 'u2', name: 'You', role: 'Member' },
    ],
  },
};

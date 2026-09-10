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
        type: 'DIRECT' as const,
        title: 'Ride to Austin',
        lastMessage: 'Leaving at 7am tomorrow.',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 2,
        participants: [
          {
            id: 'u1',
            conversationId: 'conv1',
            userId: 'u1',
            name: 'Ravi',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          },
          {
            id: 'u2',
            conversationId: 'conv1',
            userId: 'u2',
            name: 'You',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'conv2',
        type: 'DIRECT' as const,
        title: 'Roommate chat',
        lastMessage: 'Groceries done.',
        lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
        unreadCount: 0,
        participants: [
          {
            id: 'u3',
            conversationId: 'conv2',
            userId: 'u3',
            name: 'Priya',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          },
          {
            id: 'u2',
            conversationId: 'conv2',
            userId: 'u2',
            name: 'You',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'conv3',
        type: 'DIRECT' as const,
        title: 'Immigration Help',
        lastMessage: 'Can you review my docs?',
        lastMessageAt: new Date(Date.now() - 172800000).toISOString(),
        unreadCount: 1,
        participants: [
          {
            id: 'u4',
            conversationId: 'conv3',
            userId: 'u4',
            name: 'Sam',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          },
          {
            id: 'u2',
            conversationId: 'conv3',
            userId: 'u2',
            name: 'You',
            role: 'MEMBER',
            joinedAt: new Date().toISOString(),
          },
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
        body: 'Hey! Are we still on for tomorrow?',
        messageType: 'TEXT' as const,
        createdAt: new Date().toISOString(),
        sent: false,
      },
      {
        id: 'm2',
        conversationId: 'conv1',
        senderId: 'u2',
        body: 'Yes, leaving at 7am.',
        messageType: 'TEXT' as const,
        createdAt: new Date().toISOString(),
        sent: true,
      },
      {
        id: 'm3',
        conversationId: 'conv1',
        senderId: 'u1',
        body: 'Perfect, see you then.',
        messageType: 'TEXT' as const,
        createdAt: new Date().toISOString(),
        sent: false,
      },
    ],
    participants: [
      {
        id: 'u1',
        conversationId: 'conv1',
        userId: 'u1',
        name: 'Ravi',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'u2',
        conversationId: 'conv1',
        userId: 'u2',
        name: 'You',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ],
  },
  info: {
    eyebrow: 'Conversation Info',
    title: 'Ride to Austin',
    subtitle: 'Conversation details',
    participants: [
      {
        id: 'u1',
        conversationId: 'conv1',
        userId: 'u1',
        name: 'Ravi',
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      },
      {
        id: 'u2',
        conversationId: 'conv1',
        userId: 'u2',
        name: 'You',
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      },
    ],
  },
};

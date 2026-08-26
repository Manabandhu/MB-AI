# Chat

Owns Chat List, New Chat, Conversation, Conversation Info, message state, realtime subscriptions, attachments, presence, and moderation affordances.

## Component Inventory

- `frontend/src/modules/chat/api.ts` - Typed API client for conversations, messages, and participants.
- `frontend/src/modules/chat/chatFallbacks.ts` - Demo fixtures for all chat screens.
- `frontend/src/modules/chat/screens/ChatListScreen.tsx` - List of conversations with search and navigation.
- `frontend/src/modules/chat/screens/NewChatScreen.tsx` - Start new conversation from contacts list.
- `frontend/src/modules/chat/screens/ConversationScreen.tsx` - Chat messages view with composer and send.
- `frontend/src/modules/chat/screens/ConversationInfoScreen.tsx` - Conversation details and participants.
- `frontend/src/app/chat.tsx` - Route wrapper for ChatListScreen.
- `frontend/src/app/chat/new.tsx` - Route wrapper for NewChatScreen.
- `frontend/src/app/chat/[conversationId]/index.tsx` - Route wrapper for ConversationScreen.
- `frontend/src/app/chat/[conversationId]/info.tsx` - Route wrapper for ConversationInfoScreen.

## API Surface

- `listConversations()` -> `GET /api/v1/chat/conversations`
- `getConversation(id)` -> `GET /api/v1/chat/conversations/{id}`
- `listMessages(conversationId)` -> `GET /api/v1/chat/conversations/{id}/messages`
- `sendMessage(conversationId, body)` -> `POST /api/v1/chat/conversations/{id}/messages`
- `getParticipants(conversationId)` -> `GET /api/v1/chat/conversations/{id}/participants`

## Types

- `Conversation` - id, title, lastMessage, lastMessageAt, unreadCount, participants
- `Message` - id, conversationId, senderId, senderName, body, createdAt, sent
- `Participant` - id, name, avatar?, role

## Navigation

- `/chat` -> ChatListScreen
- `/chat/new` -> NewChatScreen
- `/chat/[conversationId]` -> ConversationScreen
- `/chat/[conversationId]/info` -> ConversationInfoScreen

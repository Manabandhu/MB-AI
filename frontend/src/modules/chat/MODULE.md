# Chat

Owns Chat List, New Chat, Conversation, Conversation Info, message state, realtime subscriptions, attachments, presence, and moderation affordances.

## Component Inventory

- `frontend/src/modules/chat/api.ts` - Typed API client for conversations, messages, and participants.
- `frontend/src/modules/chat/screens/ChatListScreen.tsx` - List of conversations with search and navigation.
- `frontend/src/modules/chat/screens/NewChatScreen.tsx` - Start a DIRECT or GROUP chat with people you already chat with (reopens an existing direct chat).
- `frontend/src/modules/chat/screens/ConversationScreen.tsx` - Messages (oldest first, opens at the newest), composer, pending/failed sends with Retry.
- `frontend/src/modules/chat/screens/ConversationInfoScreen.tsx` - Type, members, shared photos, report a member or the conversation (safety `ReportSheet`). No mute/leave (no endpoints).
- `frontend/src/modules/chat/components/` - `ChatFrame`, `ChatBubble`, `Composer` (exported; reused by the AI assistant).
- `frontend/src/modules/chat/chatFormat.ts` - pure labels and `contactsFromParticipants`; `contacts.ts` - `useChatContacts` (exported).
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
- `createConversation({ type, title? })` -> `POST /api/v1/chat/conversations`
- `addParticipant(conversationId, userId)` -> `POST /api/v1/chat/conversations/{id}/participants`
- `markConversationRead(conversationId, messageId?)` -> `POST /api/v1/chat/conversations/{id}/read` (used by `useMarkConversationRead`)

## Types

- `Conversation` - id, type, title?, lastMessage?, lastMessageAt?, unreadCount?
- `Message` - id, conversationId, senderId, body, messageType, createdAt
- `Participant` - id, conversationId, userId, name?, role, joinedAt

## Navigation

- `/chat` -> ChatListScreen
- `/chat/new` -> NewChatScreen
- `/chat/[conversationId]` -> ConversationScreen
- `/chat/[conversationId]/info` -> ConversationInfoScreen

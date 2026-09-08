---
name: manabandhu-chat
description: Maintain ManaBandhu direct, group, support, and AI chat, including realtime transport, conversations, membership, messages, presence, typing, delivery/read state, attachments, moderation, retention, and offline sync.
---

# Chat

## Module Purpose and Ownership

Owns Chat List, New Chat, Conversation, Conversation Info, message state, realtime subscriptions, attachments, presence, and moderation affordances. Realtime service ownership remains under `platform/chat` and `services/chat-realtime`.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/chat` | `ChatListScreen` | list | loading, empty, error |
| `/chat/new` | `NewChatScreen` | form | normal, error |
| `/chat/[conversationId]` | `ConversationScreen` | detail | loading, empty, error |
| `/chat/[conversationId]/info` | `ConversationInfoScreen` | detail | normal, error |

## Component Inventory

- `ChatListScreen` - list of conversations with search and navigation
- `NewChatScreen` - start new conversation from contacts list
- `ConversationScreen` - chat messages view with composer and send
- `ConversationInfoScreen` - conversation details and participants
- Shared: `ScreenShell`, `SearchBar`, `SectionHeader`, `ListScreen`, `Avatar`, `Card`, `AppButton`, `MessageBubble`, `Input`

## API Surface

- `listConversations()` -> `GET /api/v1/chat/conversations`
- `getConversation(id)` -> `GET /api/v1/chat/conversations/{id}`
- `listMessages(conversationId)` -> `GET /api/v1/chat/conversations/{id}/messages`
- `sendMessage(conversationId, body)` -> `POST /api/v1/chat/conversations/{id}/messages`
- `getParticipants(conversationId)` -> `GET /api/v1/chat/conversations/{id}/participants`

## Demo Fixtures

- `frontend/src/modules/chat/chatFallbacks.ts` - demo fixtures for all chat screens

## State Patterns

- **Loading**: skeleton rows while messages load
- **Empty**: `EmptyState` when no conversations or messages exist
- **Error**: `ErrorState` with retry action
- **Success**: message sent confirmation
- **Offline**: cached messages shown, new messages queued
- **Permission**: not applicable

## Navigation Actions and Cross-Module Links

- `/chat` -> `/chat/new`, `/chat/[conversationId]`
- `/chat/[conversationId]` -> `/chat/[conversationId]/info`
- Back navigation from conversation to chat list
- Deep links to chat from notifications and profile

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/chat/` are thin wrappers
- Uses `useQuery` for conversations, messages, and participants
- Realtime transport is pending; current implementation uses demo fallbacks
- Client-generated idempotency IDs used for offline send/retry
- Attachments are UI placeholders; payload bounds and scanning are backend responsibilities

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Message input has `accessibilityLabel`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Chat list, new chat, conversation, and conversation info screens are UI-complete. Realtime transport, message delivery/read state, typing/presence, and offline sync are pending backend integration.
- **Backend**: REST and GraphQL APIs implemented under `/api/v1/chat` with conversations, messages, participants, and Flyway migration V14.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent fixes: aligned frontend `api.ts` types with backend entity fields (`type`, `senderId`, `messageType`, `userId`, `role`); fixed `sendMessage` to include required `messageType: 'TEXT'`; fixed `ConversationScreen` crash on `participants.map` by using optional chaining; added `createConversation` API function; added `@Valid` to `addParticipant` endpoint.

- Recent fixes: added `sent?: boolean` to the `Message` type and `name?: string` to the `Participant` type so `ConversationScreen` (`m.sent`) and `ConversationInfoScreen` (`p.name`) typecheck; added `unreadCount?: number` to `Conversation` so `ChatListScreen` (`c.unreadCount`) typechecks; added `title?: string` to `Conversation` so `NewChatScreen` (`c.title`) typechecks.

- Recent typecheck fixes: corrected `chatFallbacks.ts` participant `role` values from `"Member"`/`"Admin"` to the enum-aligned `"MEMBER"`/`"OWNER"`; removed the non-existent `senderName` field from `Message` fallbacks.

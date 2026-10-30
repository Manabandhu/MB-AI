---
name: manabandhu-chat
description: Maintain ManaBandhu direct, group, support, and AI chat, including realtime transport, conversations, membership, messages, presence, typing, delivery/read state, attachments, moderation, retention, and offline sync.
---

# Chat

## Module Purpose and Ownership

Owns Chat List, New Chat, Conversation, Conversation Info, message state, realtime subscriptions, attachments, presence, and moderation affordances. Backend ownership is `backend/src/main/java/com/manabandhu/backend/chat/`, including `ContactOwnerService`, the single entry point other modules use to open an owner-contact conversation.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/chat` | `ChatListScreen` | list | loading, empty, error |
| `/chat/new` | `NewChatScreen` | form | normal, error |
| `/chat/[conversationId]` | `ConversationScreen` | detail | loading, empty, error |
| `/chat/[conversationId]/info` | `ConversationInfoScreen` | detail | normal, error |

## Component Inventory

- `ChatListScreen` - list of conversations with search and navigation (foundation `ChatTab` owns the tab entry)
- `NewChatScreen` - picks people from your chats (`useChatContacts`), opens an existing DIRECT chat with one person or creates DIRECT/GROUP (`createConversation` + `addParticipant`); empty state routes to rooms/rides
- `ConversationScreen` - `ChatFrame` (fixed header, list pinned to newest, keyboard-avoiding composer on iOS and Android), `ChatBubble`, `Composer`; your unsent messages live in a pending list with "Sending…" / "Not sent" + Retry/Discard
- `ConversationInfoScreen` - type badge, members (`PersonRow`, role labels), shared photos (http(s) only), Report member / Report conversation via safety's `ReportSheet`
- Module components (`chat/components/`): `ChatFrame`, `ChatBubble`, `Composer` (also exported from `chat/index.ts`; the AI assistant screen reuses them)
- Pure helpers: `chat/utils/chatFormat.ts` (`participantLabel`, `conversationTypeLabel`, `conversationTitle`, `roleLabel`, `isHttpUrl`, `contactsFromParticipants`), tested by `frontend/test/chatFormat.test.mjs`
- `chat/hooks/useContacts.ts`: `listChatContacts` / `useChatContacts` (participants of your 20 most recent conversations, deduped) - the only source of other members' ids until a member search exists; exported for expenses (add member) and safety (file a report)

## API Surface

- `listConversations()` -> `GET /api/v1/chat/conversations`
- `getConversation(id)` -> `GET /api/v1/chat/conversations/{id}`
- `listMessages(conversationId)` -> `GET /api/v1/chat/conversations/{id}/messages`
- `sendMessage(conversationId, body)` -> `POST /api/v1/chat/conversations/{id}/messages`
- `getParticipants(conversationId)` -> `GET /api/v1/chat/conversations/{id}/participants`
- `createConversation({ type: 'DIRECT'|'GROUP', title? })` -> `POST /api/v1/chat/conversations`
- `addParticipant(conversationId, userId)` -> `POST /api/v1/chat/conversations/{id}/participants` (owner only)
- `markConversationRead(conversationId, messageId?)` -> `POST /api/v1/chat/conversations/{id}/read` (body `{ messageId? }`, returns `{ conversationId, lastReadAt, unreadCount }`)

## Demo Fixtures
 
- None. Module relies on live API query responses and states.

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
- Realtime: `useRealtimeChat` (Supabase private channel, inserts + typing); read receipts: `useMarkConversationRead`
- Sending: optimistic pending entries (`temp-` ids) are never merged into the stored list; success swaps in the server message, failure keeps the text with Retry
- Picture sending is not offered: the media service has no chat bucket and a device file URI is unreadable to others. Received `IMAGE` messages render only when the body is an http(s) URL
- No mute or leave: the backend has no endpoints for them

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Message input has `accessibilityLabel`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Chat list, new chat, conversation, and conversation info screens are UI-complete. Per-user unread counts and mark-read are live (see "Unread counts and read state"); per-message delivery receipts, presence, and offline sync are pending.
- **Backend**: REST and GraphQL APIs implemented under `/api/v1/chat` with conversations, messages, participants, and Flyway migration V14.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent fixes: aligned frontend `api.ts` types with backend entity fields (`type`, `senderId`, `messageType`, `userId`, `role`); fixed `sendMessage` to include required `messageType: 'TEXT'`; fixed `ConversationScreen` crash on `participants.map` by using optional chaining; added `createConversation` API function; added `@Valid` to `addParticipant` endpoint.

- Recent fixes: added `sent?: boolean` to the `Message` type and `name?: string` to the `Participant` type so `ConversationScreen` (`m.sent`) and `ConversationInfoScreen` (`p.name`) typecheck; added `unreadCount?: number` to `Conversation` so `ChatListScreen` (`c.unreadCount`) typechecks; added `title?: string` to `Conversation` so `NewChatScreen` (`c.title`) typechecks.

- Recent typecheck fixes: corrected `chatFallbacks.ts` participant `role` values from `"Member"`/`"Admin"` to the enum-aligned `"MEMBER"`/`"OWNER"`; removed the non-existent `senderName` field from `Message` fallbacks.
- Recent optional-field fix: `chatFallbacks.ts` participant/message fixtures now include `type: 'DIRECT'`, `conversationId`, `userId`, `joinedAt`, and `messageType: 'TEXT'`; `ChatListScreen`, `NewChatScreen`, and `ConversationScreen` null-coalesce optional fields (`title`, `lastMessage`, `lastMessageAt`, `unreadCount`, `sent`) for safe rendering.
- Fallback cleanup: removed `chatFallbacks.ts` and inlined fallback arrays across `ChatListScreen`, `NewChatScreen`, `ConversationScreen`, and `ConversationInfoScreen` in favor of live React Query queries, `LoadingState`, and `ErrorState`.
- ChatListScreen overhaul & inquiry context: Elevated `ChatListScreen.tsx` with category filter tabs ("All", "Marketplace", "Rooms", "Rides"), inquiry context pills (listing titles, offer amounts, room types), verified member badges, online indicators, formatted timestamps, and unified design tokens (`#431ebe`, `#00696b`, `#ff7e33`).
- Repo-Wide Code Review & Defect Remediation: Added missing cache invalidation `queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })` in `ConversationScreen.tsx` on message send; added defensive parameter guard and `ErrorState` with retry when `conversationId` is missing; wrapped message input composer in `KeyboardAvoidingView` with `keyboardShouldPersistTaps="handled"`.
- Rooms & Rides Chat Integration: Unified cross-module chat handshake between Rooms (`ROOM_INQUIRY`) and Rides (`RIDE_TEMP`). Backend `ConversationService` dynamically enriches conversations with `lastMessage` populated from latest message; `RidesController.provisionRideChat` registers authenticated user in `conversation_participants` so ride inquiries appear in both rider and driver inboxes. `ChatListScreen` and `StitchAppShellScreen` display dedicated 🏠 Room Inquiry and 🚗 Ride Coordination badges and avatars, while `ConversationScreen` accurately resolves sender vs recipient alignment via `useAuthStore`.
- Real-Time Chat Engine & Broadcast Typing (corrected in the 2026-10 hardening: it previously listened to the unused `chat_messages` table): Integrated `useRealtimeChat.ts` hook utilizing `supabase.channel` for instant <50ms Postgres Changes message delivery and ephemeral typing indicator broadcasts without polling. Enhanced `ConversationScreen` with optimistic message rendering, sticky bottom bar, and `expo-image-picker` photo attachments. Enhanced `ChatListScreen` with dedicated tabs for `Direct Messages` and `Temporary Carpools`. Upgraded `ConversationInfoScreen` with participant member lists, media gallery, and controls (`Mute Notifications`, `Leave Group`, `Report User`).
- Security & correctness hardening (2026-10): All chat reads/writes require active participation (`ConversationParticipantService.requireParticipant`); only owners invite; users may create only `DIRECT`/`GROUP` conversations and cannot send `SYSTEM` messages; re-adding a participant re-activates the existing row; message lists are newest-first and capped (default 100, max 200); the conversation list loads only the latest message per conversation. The unused STOMP `/ws` endpoint and websocket dependency were removed. `useRealtimeChat` listens to `public.messages` (the table the backend writes) on a private `conversation:<id>` channel; V31 adds a participant-only RLS policy, the realtime publication entry, and realtime.messages policies for typing broadcasts.
- Sample data removal (2026-10 review): `ChatListScreen` no longer prepends `SAMPLE_INQUIRIES` or shows fake online/verified indicators; it renders only conversations returned by `/api/v1/chat/conversations`.
- Chat list no longer carries presence/verification fields or badge rendering; they return when the backend tracks them.
- Cleanup: deleted the unused `ChatListScreen.tsx`; the `/chat` tab is `foundation/screens/shell/ChatShell.tsx`. Removed unused chat API exports and repository methods.
- Public API: `chat/index.ts` exports `moduleMeta` and `listConversations`/`Conversation` for the foundation Chat tab.
- Design-system pass (2026-10): exact design-system hex values in this module were replaced with `palette.*` references and numeric width checks with `breakpoint.*` tokens (desktop layouts now start at `breakpoint.medium` = 600 instead of 768). Remaining literals are listed in `scripts/design-baseline.json`; clear them during this module's review and run `node scripts/verify-design-system.mjs --update`.
- P0 audit (2026-10-10): `ConversationParticipantService.requireParticipant` records `chat.admin_access` (actor, conversation id) in `admin_audit_log` whenever an admin reads or writes a conversation they are not a participant of. `AdminAuditService.record` runs in its own transaction so read-only chat reads can write the audit row.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['messages', 'inbox', 'dm', 'conversation', 'talk']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- Tab badge (2026-10-12): the foundation tab bars sum `Conversation.unreadCount` from the shared `['chat', 'conversations']` query (`useChatUnread`); `ChatTab` shows the same counts as list pills.
- Unread counts and read state (2026-10-12): V42 adds `conversation_participants.last_read_at` (existing rows backfilled to the migration time so old history is not unread) and the `messages (conversation_id, created_at)` index. `unreadCount` = messages from other senders with `created_at > coalesce(last_read_at, joined_at)` for the caller's active participation (no soft-delete flag exists on `messages`). `ConversationService.findByParticipant` fills it for every conversation with one grouped JPQL query (`MessageRepository.countUnreadByConversation`, `UnreadCount` record); `GET /conversations/{id}` goes through `ConversationService.findFor` (requireParticipant, then the caller's count; an admin who is not a member is audited and gets `unreadCount: null`). `POST /conversations/{id}/read` (`ConversationService.markRead`) needs an *active* participant (`ConversationParticipantService.requireActiveParticipant`: 403 for strangers, former members and non-member admins, no audit row); an optional `messageId` must belong to the conversation (404) and sets the marker to that message's `created_at`, otherwise now. `ConversationParticipantRepository.advanceLastReadAt` is a single conditional UPDATE so the marker never moves backwards; `last_read_at` is mapped `insertable/updatable = false` and has a package-private getter so participant lists never expose other members' read times. Frontend: `useMarkConversationRead` (in `ConversationScreen`) marks read up to the newest stored message (`readState.latestServerMessageId`, skipping optimistic `temp-` ids), debounced 600 ms, only while the screen is focused and the app is active, on open and when new messages arrive; it writes the server-returned count into the `['chat', 'conversations']` cache (`withUnreadCount`) and invalidates it only after a 2xx. Failures are ignored silently (the badge keeps the server's count; the next message or focus retries). Text and image sends both invalidate `['chat', 'conversations']`. Tests: `chat/ChatReadStateTest` (H2 `@DataJpaTest` through the services), `frontend/test/chatReadState.test.mjs`, and the smoke suite's ride-chat read-state checks.
- Realtime (2026-10-12): `useRealtimeChat` marks a live row `sent` only when `sender_id` is the viewer, so other members' messages no longer render as the viewer's own.
- Mark-read (2026-10-12): a failed background mark-read logs a `console.warn` and leaves the badge until a later attempt succeeds; the 0-row update returns 403 "Not an active participant in this conversation".
- P0/P1 pass (2026-10-13): removed fake mute/leave/report and the false "Offline… sending disabled" banner; Report now files `POST /api/v1/safety/reports` (member: `user:<reason>`, conversation: `conversation:<reason>`). Failed sends show "Not sent" with Retry/Discard instead of a stale sent bubble. Image picking removed (no chat bucket). Conversation info labels GROUP/ROOM_INQUIRY/RIDE_TEMP correctly. NewChat starts real conversations. Screens use shared primitives and tokens (no hex). Icons: `more` for details and `arrow-right` for send until `AppIcon` gains `info`/`send`.
- Review follow-up (2026-10-14):
  - Ride chats really are deleted: `RideOfferService` sets `chat_expires_at` = completion + 2 h and `RideChatPurgeScheduler` runs `purge_expired_ride_chats()` every 10 minutes. `ConversationScreen` shows an honest notice for `type === 'RIDE_TEMP'` only (the old banner matched "ride" in the title and said "after trip arrival").
  - Realtime copies of your own message drop the matching pending/failed entry (`withoutDeliveredPending`), so Retry cannot post a message the server already saved.
  - `NewChatScreen` throws (and does not navigate) when every participant add fails; there is no endpoint to delete the empty conversation.
  - `ChatFrame` drops the home-indicator inset under the composer while the keyboard is open.
- Visual QA pass (2026-10-14, offline stack, 390/768/1440 light+dark): message times use `hour: 'numeric'` ("1:59 PM", not "01:59 PM"). The offline stack has no Supabase Realtime, so the conversation screen logs a failed `ws://localhost:9999/realtime` handshake locally; that is expected there.
- Structure cleanup (2026-10-30): imports use `@/lib/api` (the `@/lib/apiClient` shim was removed) and `@/modules/shared/ui/*` (the old `shared/components` folder and the per-module `utils/notify` re-exports were removed; use `@/modules/shared/ui/notify`). Dates, times and counts go through `@manabandhu/core` (`formatDate`, `formatTime`, `formatNumber`) instead of `toLocale*String`. The module follows the layout in `frontend/src/modules/README.md` (`utils/`, `hooks/`, `stores/`). `chatFormat`/`readState` moved to `utils/`; `contacts.ts` is now `hooks/useContacts.ts`, next to `useMarkConversationRead` and `useRealtimeChat`.
- `ContactOwnerService` (2026-10-30) is the one place that opens an owner-contact conversation (`open`) or posts into a reused one (`post`): it adds the owner as MEMBER (the requester is OWNER from `ConversationService.create`), sends the first message, and notifies the owner with `/chat/{id}`. Titles are cut to 200 characters. Tested by `ContactOwnerServiceTest`.

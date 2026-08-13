---
name: manabandhu-chat
description: Maintain ManaBandhu direct, group, support, and AI chat, including realtime transport, conversations, membership, messages, presence, typing, delivery/read state, attachments, moderation, retention, and offline sync.
---

# Chat

Frontend conversation experiences belong to `frontend/src/modules/chat`; realtime service ownership remains under `services/chat-realtime` and `platform/chat`.

The owned screen set is Chat List, New Chat, Conversation, and Conversation Info.

1. Read `platform/chat/MODULE.md` and `services/chat-realtime/MODULE.md`.
2. Use one conversation model with typed participants and message kinds for humans, support agents, and bots.
3. Enforce membership and block/report rules on every read/write; never rely only on UI visibility.
4. Separate durable messages from ephemeral typing/presence. Use client-generated idempotency IDs for offline send/retry.
5. Scan attachments, bound payloads, define retention, and exclude content from analytics and logs.
6. Test ordering, reconnect, duplicates, authorization, moderation, deletion, and bot handoff.
7. Update this skill when chat schema, transport, retention, moderation, or paths change.

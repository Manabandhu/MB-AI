# AI Assistant

Owns user-facing assistant and bot experiences, streaming UI, consent, safety feedback, citations, and typed integration with the AI orchestrator.

## Component Inventory

- `AssistantScreen` - chat UI (chat module's `ChatFrame`/`ChatBubble`/`Composer`), oldest first, honest "not connected to an AI model yet" subtitle, thinking indicator, failed sends restore the question.
- `AssistantHistoryScreen` - past conversations; tap one to read its messages.
- `AssistantCitationsScreen` - sources; http(s) links open in the browser.
- `assistantFormat.ts` - `oldestFirst`, `isUserRole`, `safeExternalUrl`.

## API

- `GET /api/v1/assistant/messages` - latest conversation's `AssistantMessage[]`
- `POST /api/v1/assistant/messages` - accepts `{ content }`, returns the assistant reply
- `GET /api/v1/assistant/history` - `AssistantConversation[]`
- `GET /api/v1/assistant/conversations/{id}/messages` - one conversation's messages
- `GET /api/v1/assistant/citations` - `AssistantCitation[]`

## Routes

- `/assistant` - `AssistantScreen`
- `/assistant/history` - `AssistantHistoryScreen`
- `/assistant/citations` - `AssistantCitationsScreen`

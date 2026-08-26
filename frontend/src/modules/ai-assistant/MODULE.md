# AI Assistant

Owns user-facing assistant and bot experiences, streaming UI, consent, safety feedback, citations, and typed integration with the AI orchestrator.

## Component Inventory

- `AssistantScreen` - chat screen with `MessageBubble`, message input, offline banner, and history/citations actions
- `AssistantHistoryScreen` - list screen of past conversations with `SectionHeader`
- `AssistantCitationsScreen` - list screen of source citations with `SectionHeader`

## API

- `GET /api/v1/assistant/messages` - returns `AssistantMessage[]`
- `POST /api/v1/assistant/messages` - accepts `{ text: string }`, returns `AssistantMessage`
- `GET /api/v1/assistant/history` - returns `AssistantConversation[]`
- `GET /api/v1/assistant/citations` - returns `AssistantCitation[]`

## Routes

- `/assistant` - `AssistantScreen`
- `/assistant/history` - `AssistantHistoryScreen`
- `/assistant/citations` - `AssistantCitationsScreen`

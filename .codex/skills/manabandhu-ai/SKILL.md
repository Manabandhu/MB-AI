---
name: manabandhu-ai
description: Maintain ManaBandhu AI assistant and chatbot capabilities, including model routing, retrieval, tools, prompts, safety, privacy, evaluations, cost controls, citations, feedback, and human escalation. Use for any generative-AI or agentic workflow.
---

# AI Assistant

## Module Purpose and Ownership

Owns user-facing assistant and bot experiences, streaming UI, consent, safety feedback, citations, and typed integration with the AI orchestrator. Orchestration and evaluation infrastructure remain under `services/ai-orchestrator` and `platform/ai`.

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/assistant` | `AssistantScreen` | chat | loading, empty, error, offline |
| `/assistant/history` | `AssistantHistoryScreen` | list | loading, empty, error |
| `/assistant/citations` | `AssistantCitationsScreen` | list | loading, empty, error |

## Component Inventory

- `AssistantScreen` - chat screen with `MessageBubble`, message input, offline banner, and history/citations actions
- `AssistantHistoryScreen` - list screen of past conversations with `SectionHeader`
- `AssistantCitationsScreen` - list screen of source citations with `SectionHeader`
- Shared: `ScreenShell`, `MessageBubble`, `Input`, `AppButton`, `Avatar`, `SectionHeader`, `Banner`, `ListScreen`, `Card`

## API Surface

- `getAssistantMessages()` -> `GET /api/v1/assistant/messages`
- `sendAssistantMessage(input)` -> `POST /api/v1/assistant/messages`
- `getAssistantHistory()` -> `GET /api/v1/assistant/history`
- `getAssistantCitations()` -> `GET /api/v1/assistant/citations`

## Demo Fixtures

- `frontend/src/modules/ai-assistant/assistantFallbacks.ts` - demo fixtures for assistant messages and history

## State Patterns

- **Loading**: `LoadingState` while messages load
- **Empty**: `EmptyState` when no conversation history or citations exist
- **Error**: `ErrorState` with retry action
- **Success**: message sent confirmation
- **Offline**: cached messages shown, new queries disabled
- **Permission**: microphone permission optional for voice input; text-only mode shown if missing

## Navigation Actions and Cross-Module Links

- `/assistant` -> `/assistant/history`, `/assistant/citations`
- Back navigation from history/citations to assistant
- Cross-module: assistant can reference rooms, rides, community, and safety data via retrieval

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/assistant/` are thin wrappers
- Uses `useQuery` for messages, history, and citations
- Message send uses mutation with offline catch
- `useAdaptiveLayout` governs responsive max-width
- Streaming UI is a placeholder; real streaming is pending orchestrator integration
- Styling uses `StyleSheet` + Tailwind utilities via `uniwind`

## Accessibility and Responsive Behavior Rules

- Minimum touch target: 44x44pt
- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Message input has `accessibilityLabel`
- Focus ring: 3pt, color: `color.primary`
- Reduced motion: disable animations when `accessibility.reducedMotion` is true
- Single column on compact, 2 columns on medium, 3 columns on expanded/wide
- Safe area insets always respected

## Current Implementation Status

- **Partial**: Assistant, history, and citations screens are UI-complete. AI orchestration, model routing, retrieval, tools, safety moderation, and streaming are pending backend/platform integration.
- **Backend**: REST and GraphQL APIs implemented under `/api/v1/assistant` with conversations, messages, citations, SSE streaming endpoint, and Flyway migration V15.

- Recent client-side refactor: shared API response parsing helpers in `frontend/src/lib/apiClient.ts` replaced duplicated module-local response handling across module API files.

- Recent fixes: aligned frontend `api.ts` types with backend entity fields (`content`, `createdAt`, `role`, `snippet`, `url`); fixed `sendAssistantMessage` payload from `{ text }` to `{ content }`; updated `AssistantMessageService.sendRecent()` to persist USER message and generate an ASSISTANT reply; made `userId` nullable in `AssistantConversation` for recent-message conversations.

- Recent fixes: fixed `AssistantController` import typo — `annotationPathVariable` corrected to `annotation/path/PathVariable` (Spring Boot 3 compilation break).

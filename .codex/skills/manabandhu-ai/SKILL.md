---
name: manabandhu-ai
description: Maintain ManaBandhu AI assistant and chatbot capabilities, including model routing, retrieval, tools, prompts, safety, privacy, evaluations, cost controls, citations, feedback, and human escalation. Use for any generative-AI or agentic workflow.
---

# AI Assistant

## Module Purpose and Ownership

Owns user-facing assistant and bot experiences, streaming UI, consent, safety feedback, citations, and typed integration with a model provider. Backend ownership is `backend/src/main/java/com/manabandhu/backend/ai/`; replies stay a placeholder until a provider and an evaluation suite exist (the old `ai-evaluations` workflow and `services/ai-orchestrator` placeholder were removed on 2026-10-30).

## Route Inventory

| Route | Screen Component | Type | States |
|---|---|---|---|
| `/assistant` | `AssistantScreen` | chat | loading, empty, error, sending |
| `/assistant/history` | `AssistantHistoryScreen` | list | loading, empty, error |
| `/assistant/citations` | `AssistantCitationsScreen` | list | loading, empty, error |

## Component Inventory

- `AssistantScreen` - chat's `ChatFrame`/`ChatBubble`/`Composer` (imported from `@/modules/chat`); messages oldest first; honest subtitle ("not connected to an AI model yet"); pending question bubble + "Assistant is replying…"; a failed send restores the question into the input and shows an inline alert; header icon buttons for History and Citations; back falls back to `/`
- `AssistantHistoryScreen` - `Screen`/`ScreenHeader`; each conversation `Card` expands to load and show its messages
- `AssistantCitationsScreen` - citation `Card`s open their http(s) URL with `Linking` (other schemes are ignored)
- Pure helpers: `ai-assistant/utils/assistantFormat.ts` (`oldestFirst`, `isUserRole`, `safeExternalUrl`), tested in `frontend/test/safetyUtilities.test.mjs`

## API Surface

- `getAssistantMessages()` -> `GET /api/v1/assistant/messages` (latest conversation, oldest first)
- `sendAssistantMessage({ content })` -> `POST /api/v1/assistant/messages` (stores the question in the latest conversation and returns the backend's fixed "not connected to an AI model yet" reply)
- `getAssistantHistory()` -> `GET /api/v1/assistant/history`
- `getAssistantConversationMessages(id)` -> `GET /api/v1/assistant/conversations/{id}/messages`
- `getAssistantCitations()` -> `GET /api/v1/assistant/citations`

## Demo Fixtures

- None. Module relies on live API query responses and states.

## State Patterns

- **Loading**: `LoadingState` while messages load
- **Empty**: `EmptyState` when no conversation history or citations exist
- **Error**: `ErrorState` with retry action
- **Success**: message sent confirmation
- **Send failure**: the question goes back into the input with an inline alert; there is no offline mode
- **Permission**: microphone permission optional for voice input; text-only mode shown if missing

## Navigation Actions and Cross-Module Links

- `/assistant` -> `/assistant/history`, `/assistant/citations`
- Back navigation from history/citations to assistant
- Cross-module: assistant can reference rooms, rides, community, and safety data via retrieval

## Implementation Notes for Expo React Native

- Route files in `frontend/src/app/assistant/` are thin wrappers
- Uses `useQuery` for messages, history, and citations
- Message send is a mutation; the input is cleared on send and restored on failure
- No streaming UI; replies arrive with the POST response
- Styling uses shared Tamagui primitives and tokens only

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

- Recent typecheck fixes: added optional UI fields (`body`, `time`, `sent`) to `AssistantMessage`, (`body`, `meta`, `route`) to `AssistantConversation`, and (`body`, `meta`, `source`) to `AssistantCitation`; switched `assistantFallbacks.ts` casts from `as` to `satisfies`; fixed `AssistantScreen` send payload from `{ text }` to `{ content }`.
- Recent fixture/type fix: `assistantFallbacks.ts` added `conversationId`, `role`, `content`, `createdAt` to message fixtures, `createdAt`/`updatedAt` to conversation fixtures, and `messageId`/`url`/`snippet`/`createdAt` to citation fixtures; `AssistantScreen` now null-coalesces `body`/`sent`/`time` when rendering message bubbles.
- Fallback cleanup: deleted `assistantFallbacks.ts` and removed inline fallbacks from `AssistantScreen`, `AssistantHistoryScreen`, and `AssistantCitationsScreen` in favor of live React Query queries, `LoadingState`, `ErrorState`, and `EmptyState`.
- Public API: `ai-assistant/index.ts` exports `moduleMeta` (launcher entry, route `/assistant`).
- `ai-assistant/home/AssistantEntry.tsx` (exported from `index.ts`) is the Home entry: an input-like card plus quick prompts that open `/assistant?prompt=…`. `AssistantScreen` reads `prompt` and only pre-fills the input; the member still sends it.
- Launcher keywords (2026-10-12): `module.ts` sets `keywords: ['ask', 'question', 'help', 'ai', 'chatbot', 'answers']` (`ModuleMeta.keywords`), which Explore search matches by word prefix alongside the label, summary and category. Keep them to things this module does today.
- P0/P1 pass (2026-10-13): fixed reversed message order, removed the false "Offline… disabled" banner, kept the question on failed sends, honest "not connected to an AI model yet" subtitle (matches `AssistantController`), thinking indicator, auto-scroll, keyboard-avoiding composer, back button, send icon (`arrow-right`), tappable history rows (per-conversation messages) and citation links. Screens moved off `SafeAreaView`/`StyleSheet` onto shared primitives.
- `AssistantEntry` keyboard access (2026-10-14): the ask field and the search square spread `keyboardPress` and have a focus ring, so Tab + Enter/Space work on web.
- Visual QA pass (2026-10-14, offline stack, 390/768/1440 light+dark): the assistant subtitle is shorter ("Preview: no AI model connected, so it can't answer yet.") so the honest notice fits two lines on phones instead of ending in an ellipsis.

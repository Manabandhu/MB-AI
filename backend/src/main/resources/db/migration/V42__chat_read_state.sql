-- Per-participant read state for chat unread counts (ConversationService) and POST .../conversations/{id}/read.
-- conversation_participants already has RLS on with anon/authenticated revoked (V14); no policy change here.
ALTER TABLE public.conversation_participants
    ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- Existing members start with everything read, so the first deploy does not light up badges for old history.
UPDATE public.conversation_participants
SET last_read_at = now()
WHERE last_read_at IS NULL;

-- Unread counts and the latest-message lookup both scan one conversation's messages by time.
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
    ON public.messages (conversation_id, created_at);

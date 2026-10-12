package com.manabandhu.backend.chat;

import java.util.UUID;

/** Unread messages in one conversation for one participant (see {@link MessageRepository#countUnreadByConversation}). */
record UnreadCount(UUID conversationId, long count) {
}

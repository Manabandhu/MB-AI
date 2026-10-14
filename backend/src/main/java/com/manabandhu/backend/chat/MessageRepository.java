package com.manabandhu.backend.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId, Pageable pageable);

    Optional<Message> findFirstByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    Optional<Message> findByIdAndConversationId(UUID id, UUID conversationId);

    /**
     * Unread messages per active conversation of {@code userId}, in one grouped query: messages from other senders
     * created after the participant's read marker (or after they joined, before their first read). Conversations
     * with nothing unread have no row.
     */
    @Query("""
            SELECT new com.manabandhu.backend.chat.UnreadCount(p.conversationId, COUNT(m))
            FROM ConversationParticipant p, Message m
            WHERE m.conversationId = p.conversationId
              AND p.userId = :userId
              AND p.leftAt IS NULL
              AND m.senderId <> :userId
              AND m.createdAt > COALESCE(p.lastReadAt, p.joinedAt)
            GROUP BY p.conversationId
            """)
    List<UnreadCount> countUnreadByConversation(@Param("userId") UUID userId);

    /** Same rule as {@link #countUnreadByConversation} for a single conversation. */
    @Query("""
            SELECT COUNT(m)
            FROM ConversationParticipant p, Message m
            WHERE m.conversationId = p.conversationId
              AND p.conversationId = :conversationId
              AND p.userId = :userId
              AND p.leftAt IS NULL
              AND m.senderId <> :userId
              AND m.createdAt > COALESCE(p.lastReadAt, p.joinedAt)
            """)
    long countUnread(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}

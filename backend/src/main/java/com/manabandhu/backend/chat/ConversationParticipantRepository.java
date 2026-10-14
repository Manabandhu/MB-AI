package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {
    List<ConversationParticipant> findByConversationIdAndLeftAtIsNull(UUID conversationId);
    Optional<ConversationParticipant> findByConversationIdAndUserId(UUID conversationId, UUID userId);
    List<ConversationParticipant> findByUserIdAndLeftAtIsNull(UUID userId);

    /**
     * Moves an active participant's read marker forward to {@code readAt}, in one statement so it stays monotonic under
     * concurrent calls (a NULL marker counts as unset). Returns the number of rows matched (0 when not an active
     * participant).
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            UPDATE public.conversation_participants
            SET last_read_at = CASE WHEN last_read_at IS NULL OR last_read_at < :readAt
                                    THEN :readAt ELSE last_read_at END
            WHERE conversation_id = :conversationId AND user_id = :userId AND left_at IS NULL
            """, nativeQuery = true)
    int advanceLastReadAt(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId,
                          @Param("readAt") Instant readAt);
}

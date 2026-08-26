package com.manabandhu.backend.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {
    List<ConversationParticipant> findByConversationIdAndLeftAtIsNull(UUID conversationId);
    Optional<ConversationParticipant> findByConversationIdAndUserId(UUID conversationId, UUID userId);
    List<ConversationParticipant> findByUserIdAndLeftAtIsNull(UUID userId);
}

package com.manabandhu.backend.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface AssistantMessageRepository extends JpaRepository<AssistantMessage, UUID> {
    List<AssistantMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    List<AssistantMessage> findTop20ByOrderByCreatedAtDesc();

    AssistantMessage findTop1ByOrderByCreatedAtDesc();
}

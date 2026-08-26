package com.manabandhu.backend.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface AssistantConversationRepository extends JpaRepository<AssistantConversation, UUID> {
    List<AssistantConversation> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}

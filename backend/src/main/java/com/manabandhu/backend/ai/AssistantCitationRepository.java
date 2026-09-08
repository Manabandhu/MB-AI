package com.manabandhu.backend.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface AssistantCitationRepository extends JpaRepository<AssistantCitation, UUID> {
    List<AssistantCitation> findByMessageIdOrderByCreatedAtAsc(UUID messageId);

    List<AssistantCitation> findTop20ByOrderByCreatedAtDesc();
}

package com.manabandhu.backend.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByIdInOrderByLastMessageAtDesc(List<UUID> ids);
}

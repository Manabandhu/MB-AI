package com.manabandhu.backend.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);
    List<Message> findByConversationIdAndSenderIdOrderByCreatedAtDesc(UUID conversationId, UUID senderId);
}

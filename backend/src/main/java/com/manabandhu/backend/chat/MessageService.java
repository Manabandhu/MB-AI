package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository repository;
    private final ConversationService conversationService;

    MessageService(MessageRepository repository, ConversationService conversationService) {
        this.repository = repository;
        this.conversationService = conversationService;
    }

    @Transactional(readOnly = true)
    public List<Message> findByConversation(UUID conversationId) {
        return repository.findByConversationIdOrderByCreatedAtDesc(conversationId);
    }

    @Transactional
    public Message send(UUID conversationId, UUID senderId, String body, Message.MessageType messageType) {
        var message = repository.save(new Message(conversationId, senderId, body, messageType));
        conversationService.updateLastMessageAt(conversationId, Instant.now());
        return message;
    }
}

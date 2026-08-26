package com.manabandhu.backend.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationParticipantService {

    private final ConversationParticipantRepository repository;

    ConversationParticipantService(ConversationParticipantRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ConversationParticipant> findByConversation(UUID conversationId) {
        return repository.findByConversationIdAndLeftAtIsNull(conversationId);
    }

    @Transactional
    public ConversationParticipant add(UUID conversationId, UUID userId, ConversationParticipant.ParticipantRole role) {
        return repository.save(new ConversationParticipant(conversationId, userId, role));
    }

    @Transactional
    public void leave(UUID conversationId, UUID userId) {
        repository.findByConversationIdAndUserId(conversationId, userId).ifPresent(ConversationParticipant::leave);
    }
}

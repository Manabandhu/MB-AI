package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConversationService {

    private final ConversationRepository repository;
    private final ConversationParticipantRepository participantRepository;

    ConversationService(ConversationRepository repository, ConversationParticipantRepository participantRepository) {
        this.repository = repository;
        this.participantRepository = participantRepository;
    }

    @Transactional(readOnly = true)
    public List<Conversation> findByParticipant(UUID userId) {
        var participants = participantRepository.findByUserIdAndLeftAtIsNull(userId);
        var ids = participants.stream().map(ConversationParticipant::getConversationId).toList();
        return repository.findByIdInOrderByLastMessageAtDesc(ids);
    }

    @Transactional(readOnly = true)
    public Conversation find(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional
    public Conversation create(UUID ownerId, Conversation.ConversationType type, String title) {
        var conversation = repository.save(new Conversation(type, title));
        participantRepository.save(new ConversationParticipant(conversation.getId(), ownerId, ConversationParticipant.ParticipantRole.OWNER));
        return conversation;
    }

    @Transactional
    public void updateLastMessageAt(UUID conversationId, Instant at) {
        repository.findById(conversationId).ifPresent(c -> c.updateLastMessageAt(at));
    }
}

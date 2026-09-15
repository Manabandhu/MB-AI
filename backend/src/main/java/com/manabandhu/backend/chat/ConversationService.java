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
    private final MessageRepository messageRepository;

    ConversationService(ConversationRepository repository,
                        ConversationParticipantRepository participantRepository,
                        MessageRepository messageRepository) {
        this.repository = repository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
    }

    @Transactional(readOnly = true)
    public List<Conversation> findByParticipant(UUID userId) {
        var participants = participantRepository.findByUserIdAndLeftAtIsNull(userId);
        if (participants.isEmpty()) {
            return List.of();
        }
        var ids = participants.stream().map(ConversationParticipant::getConversationId).toList();
        var list = repository.findByIdInOrderByLastMessageAtDesc(ids);
        for (var conv : list) {
            var msgs = messageRepository.findByConversationIdOrderByCreatedAtDesc(conv.getId());
            if (!msgs.isEmpty()) {
                conv.setLastMessage(msgs.get(0).getBody());
            }
        }
        return list;
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

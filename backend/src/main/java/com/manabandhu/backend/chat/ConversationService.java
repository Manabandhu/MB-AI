package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

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
            messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conv.getId())
                    .ifPresent(latest -> conv.setLastMessage(latest.getBody()));
        }
        return list;
    }

    @Transactional(readOnly = true)
    public Conversation find(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }

    /** Conversations a user may start directly; inquiry and ride chats are created by their own flows. */
    @Transactional
    public Conversation createAs(Actor actor, Conversation.ConversationType type, String title) {
        if (type != Conversation.ConversationType.DIRECT && type != Conversation.ConversationType.GROUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only DIRECT or GROUP conversations can be created");
        }
        return create(actor.id(), type, title);
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

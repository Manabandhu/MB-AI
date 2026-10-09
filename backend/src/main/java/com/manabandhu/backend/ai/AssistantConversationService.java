package com.manabandhu.backend.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class AssistantConversationService {

    private final AssistantConversationRepository repository;

    AssistantConversationService(AssistantConversationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AssistantConversation> findByUser(UUID userId) {
        return repository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    /** Conversations are private to their owner; admins may read them for support. */
    @Transactional(readOnly = true)
    public AssistantConversation requireOwned(Actor actor, UUID id) {
        var conversation = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
        if (conversation.getUserId() == null) {
            actor.requireAdmin();
        } else {
            actor.requireOwner(conversation.getUserId(), "Not your conversation");
        }
        return conversation;
    }

    /** The caller's most recent conversation, created on first use. */
    @Transactional
    public AssistantConversation latestOrCreate(UUID userId) {
        var existing = repository.findByUserIdOrderByUpdatedAtDesc(userId);
        return existing.isEmpty() ? repository.save(new AssistantConversation(userId, "Assistant chat")) : existing.get(0);
    }

    @Transactional(readOnly = true)
    public AssistantConversation find(UUID id) {
        return repository.findById(id).orElseThrow();
    }

    @Transactional(readOnly = true)
    public java.util.Optional<AssistantConversation> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public AssistantConversation create(UUID userId, String title) {
        return repository.save(new AssistantConversation(userId, title));
    }

    @Transactional
    public AssistantConversation touch(UUID id) {
        var conversation = repository.findById(id).orElseThrow();
        conversation.touch();
        return conversation;
    }
}

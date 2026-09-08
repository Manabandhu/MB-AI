package com.manabandhu.backend.ai;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public List<AssistantConversation> listRecent() {
        return repository.findTop20ByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public AssistantConversation find(UUID id) {
        return repository.findById(id).orElseThrow();
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

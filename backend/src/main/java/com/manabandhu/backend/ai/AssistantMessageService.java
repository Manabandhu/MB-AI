package com.manabandhu.backend.ai;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AssistantMessageService {

    private final AssistantMessageRepository repository;
    private final AssistantConversationService conversationService;

    AssistantMessageService(AssistantMessageRepository repository, AssistantConversationService conversationService) {
        this.repository = repository;
        this.conversationService = conversationService;
    }

    @Transactional(readOnly = true)
    public List<AssistantMessage> findByConversation(UUID conversationId) {
        return repository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional
    public AssistantMessage send(UUID conversationId, AssistantMessage.MessageRole role, String content) {
        var message = repository.save(new AssistantMessage(conversationId, role, content));
        conversationService.touch(conversationId);
        return message;
    }

    @Transactional(readOnly = true)
    public AssistantMessage requireMessage(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
    }
}

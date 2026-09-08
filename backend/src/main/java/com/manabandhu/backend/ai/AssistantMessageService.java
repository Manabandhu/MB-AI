package com.manabandhu.backend.ai;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public List<AssistantMessage> listRecent() {
        return repository.findTop20ByOrderByCreatedAtDesc();
    }

    @Transactional
    public AssistantMessage send(UUID conversationId, AssistantMessage.MessageRole role, String content) {
        var message = repository.save(new AssistantMessage(conversationId, role, content));
        conversationService.touch(conversationId);
        return message;
    }

    @Transactional
    public AssistantMessage sendRecent(String content) {
        var recent = repository.findTop1ByOrderByCreatedAtDesc();
        var conversationId = recent != null ? recent.getConversationId() : null;
        if (conversationId == null) {
            var conv = conversationService.create(null, "Assistant chat");
            conversationId = conv.getId();
        }
        var userMessage = repository.save(new AssistantMessage(conversationId, AssistantMessage.MessageRole.USER, content));
        // Generate a simple assistant reply based on the user's content
        var reply = "You said: \"" + content + "\". I'm the ManaBandhu assistant. Ask me about rooms, rides, community, or safety.";
        var assistantMessage = repository.save(new AssistantMessage(conversationId, AssistantMessage.MessageRole.ASSISTANT, reply));
        return assistantMessage;
    }
}
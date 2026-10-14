package com.manabandhu.backend.ai;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

/**
 * Assistant conversations are private to their owner. Replies are a placeholder until the
 * ai-orchestrator service is connected; see {@code services/ai-orchestrator/MODULE.md}.
 */
@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantConversationService conversationService;
    private final AssistantMessageService messageService;
    private final AssistantCitationService citationService;

    AssistantController(AssistantConversationService conversationService, AssistantMessageService messageService, AssistantCitationService citationService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.citationService = citationService;
    }

    /** Messages of the caller's most recent conversation. */
    @GetMapping("/messages")
    List<AssistantMessage> messages(Authentication authentication) {
        var userId = Actor.require(authentication).id();
        var conversations = conversationService.findByUser(userId);
        return conversations.isEmpty() ? List.of() : messageService.findByConversation(conversations.get(0).getId());
    }

    @PostMapping("/messages")
    ResponseEntity<AssistantMessage> sendMessage(Authentication authentication, @Valid @RequestBody SendAssistantMessageInput input) {
        var userId = Actor.require(authentication).id();
        var conversationId = conversationService.latestOrCreate(userId).getId();
        messageService.send(conversationId, AssistantMessage.MessageRole.USER, input.content());
        var reply = "Thanks for your question. The ManaBandhu assistant is not connected to an AI model yet, "
                + "so it cannot answer right now. Browse Rooms, Rides, Community, or Safety in the meantime.";
        var assistantMessage = messageService.send(conversationId, AssistantMessage.MessageRole.ASSISTANT, reply);
        return ResponseEntity.created(URI.create("/api/v1/assistant/messages/" + assistantMessage.getId())).body(assistantMessage);
    }

    @GetMapping("/history")
    List<AssistantConversation> history(Authentication authentication) {
        return conversationService.findByUser(Actor.require(authentication).id());
    }

    /** Citations attached to messages in the caller's most recent conversation. */
    @GetMapping("/citations")
    List<AssistantCitation> citations(Authentication authentication) {
        var messageIds = messages(authentication).stream().map(AssistantMessage::getId).toList();
        return citationService.findByMessages(messageIds);
    }

    @GetMapping("/conversations")
    List<AssistantConversation> conversations(Authentication authentication) {
        return conversationService.findByUser(Actor.require(authentication).id());
    }

    @PostMapping("/conversations")
    ResponseEntity<AssistantConversation> createConversation(Authentication authentication, @Valid @RequestBody CreateConversationRequest request) {
        var conversation = conversationService.create(Actor.require(authentication).id(), request.title());
        return ResponseEntity.created(URI.create("/api/v1/assistant/conversations/" + conversation.getId())).body(conversation);
    }

    @GetMapping("/conversations/{id}/messages")
    List<AssistantMessage> messagesByConversation(Authentication authentication, @PathVariable UUID id) {
        conversationService.requireOwned(Actor.require(authentication), id);
        return messageService.findByConversation(id);
    }

    @GetMapping("/messages/{id}/citations")
    List<AssistantCitation> citationsByMessage(Authentication authentication, @PathVariable UUID id) {
        var message = messageService.requireMessage(id);
        conversationService.requireOwned(Actor.require(authentication), message.getConversationId());
        return citationService.findByMessage(id);
    }
}

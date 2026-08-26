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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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

    @GetMapping("/conversations")
    List<AssistantConversation> conversations(Authentication authentication) {
        return conversationService.findByUser(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/conversations")
    ResponseEntity<AssistantConversation> createConversation(Authentication authentication, @RequestBody CreateConversationRequest request) {
        var conversation = conversationService.create(UUID.fromString(authentication.getName()), request.title());
        return ResponseEntity.created(URI.create("/api/v1/assistant/conversations/" + conversation.getId())).body(conversation);
    }

    @GetMapping("/conversations/{id}/messages")
    List<AssistantMessage> messages(@PathVariable UUID id) {
        return messageService.findByConversation(id);
    }

    @PostMapping("/conversations/{id}/messages")
    ResponseEntity<AssistantMessage> sendMessage(@PathVariable UUID id, @Valid @RequestBody SendAssistantMessageInput input) {
        var message = messageService.send(id, AssistantMessage.MessageRole.USER, input.content());
        return ResponseEntity.created(URI.create("/api/v1/assistant/conversations/" + id + "/messages/" + message.getId())).body(message);
    }

    @GetMapping("/conversations/{id}/stream")
    SseEmitter stream(@PathVariable UUID id) {
        var emitter = new SseEmitter(300_000L);
        emitter.onTimeout(() -> emitter.complete());
        emitter.onCompletion(emitter::complete);
        emitter.onError(throwable -> emitter.complete());
        return emitter;
    }

    @GetMapping("/messages/{id}/citations")
    List<AssistantCitation> citations(@PathVariable UUID id) {
        return citationService.findByMessage(id);
    }

    @PostMapping("/messages/{id}/citations")
    ResponseEntity<AssistantCitation> createCitation(@PathVariable UUID id, @Valid @RequestBody CreateAssistantCitationInput input) {
        var citation = citationService.create(id, input.title(), input.url(), input.snippet());
        return ResponseEntity.created(URI.create("/api/v1/assistant/messages/" + id + "/citations/" + citation.getId())).body(citation);
    }
}

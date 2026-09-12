package com.manabandhu.backend.ai;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

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

    @GetMapping("/messages")
    List<AssistantMessage> messages(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            var userId = UUID.fromString(authentication.getName());
            var userConversations = conversationService.findByUser(userId);
            if (!userConversations.isEmpty()) {
                return messageService.findByConversation(userConversations.get(0).getId());
            }
            return List.of();
        }
        return messageService.listRecent();
    }

    @PostMapping("/messages")
    ResponseEntity<AssistantMessage> sendMessage(Authentication authentication, @Valid @RequestBody SendAssistantMessageInput input) {
        if (authentication != null && authentication.getName() != null) {
            var userId = UUID.fromString(authentication.getName());
            var userConversations = conversationService.findByUser(userId);
            UUID convId;
            if (!userConversations.isEmpty()) {
                convId = userConversations.get(0).getId();
            } else {
                var conv = conversationService.create(userId, "Assistant chat");
                convId = conv.getId();
            }
            messageService.send(convId, AssistantMessage.MessageRole.USER, input.content());
            var reply = "You said: \"" + input.content() + "\". I'm the ManaBandhu assistant. Ask me about rooms, rides, community, or safety.";
            var assistantMessage = messageService.send(convId, AssistantMessage.MessageRole.ASSISTANT, reply);
            return ResponseEntity.created(URI.create("/api/v1/assistant/messages/" + assistantMessage.getId())).body(assistantMessage);
        }
        var message = messageService.sendRecent(input.content());
        return ResponseEntity.created(URI.create("/api/v1/assistant/messages/" + message.getId())).body(message);
    }

    @GetMapping("/history")
    List<AssistantConversation> history(Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            return conversationService.findByUser(actorId(authentication));
        }
        return conversationService.listRecent();
    }

    @GetMapping("/citations")
    List<AssistantCitation> citations() {
        return citationService.listRecent();
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
    ResponseEntity<List<AssistantMessage>> messagesByConversation(Authentication authentication, @PathVariable UUID id) {
        var conversation = conversationService.findById(id).orElse(null);
        if (conversation == null) {
            return ResponseEntity.notFound().build();
        }
        if (conversation.getUserId() != null && !conversation.getUserId().equals(actorId(authentication)) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(messageService.findByConversation(id));
    }

    private UUID actorId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    @GetMapping("/messages/{id}/citations")
    List<AssistantCitation> citationsByMessage(@PathVariable UUID id) {
        return citationService.findByMessage(id);
    }

    @PostMapping("/messages/{id}/citations")
    ResponseEntity<AssistantCitation> createCitation(@PathVariable UUID id, @Valid @RequestBody CreateAssistantCitationInput input) {
        var citation = citationService.create(id, input.title(), input.url(), input.snippet());
        return ResponseEntity.created(URI.create("/api/v1/assistant/messages/" + id + "/citations/" + citation.getId())).body(citation);
    }
}
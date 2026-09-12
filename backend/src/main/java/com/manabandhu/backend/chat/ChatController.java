package com.manabandhu.backend.chat;

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

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final ConversationParticipantService participantService;

    ChatController(ConversationService conversationService, MessageService messageService, ConversationParticipantService participantService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.participantService = participantService;
    }

    @GetMapping("/conversations")
    List<Conversation> conversations(Authentication authentication) {
        return conversationService.findByParticipant(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/conversations/{id}")
    ResponseEntity<Conversation> getConversation(Authentication authentication, @PathVariable UUID id) {
        if (!participantService.isParticipant(id, actorId(authentication)) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(conversationService.find(id));
    }

    @PostMapping("/conversations")
    ResponseEntity<Conversation> createConversation(Authentication authentication, @Valid @RequestBody CreateConversationInput input) {
        var type = Conversation.ConversationType.valueOf(input.type());
        var conversation = conversationService.create(UUID.fromString(authentication.getName()), type, input.title());
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + conversation.getId())).body(conversation);
    }

    @GetMapping("/conversations/{id}/messages")
    ResponseEntity<List<Message>> messages(Authentication authentication, @PathVariable UUID id) {
        if (!participantService.isParticipant(id, actorId(authentication)) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(messageService.findByConversation(id));
    }

    @PostMapping("/conversations/{id}/messages")
    ResponseEntity<Message> sendMessage(Authentication authentication, @PathVariable UUID id, @Valid @RequestBody SendMessageInput input) {
        if (!participantService.isParticipant(id, actorId(authentication)) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        var messageType = Message.MessageType.valueOf(input.messageType());
        var message = messageService.send(id, UUID.fromString(authentication.getName()), input.body(), messageType);
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + id + "/messages/" + message.getId())).body(message);
    }

    @GetMapping("/conversations/{id}/participants")
    ResponseEntity<List<ConversationParticipant>> participants(Authentication authentication, @PathVariable UUID id) {
        if (!participantService.isParticipant(id, actorId(authentication)) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(participantService.findByConversation(id));
    }

    @PostMapping("/conversations/{id}/participants")
    ResponseEntity<ConversationParticipant> addParticipant(Authentication authentication, @PathVariable UUID id, @RequestBody AddParticipantInput input) {
        if (!participantService.isParticipant(id, actorId(authentication)) && !isAdmin(authentication)) {
            return ResponseEntity.status(403).build();
        }
        var participant = participantService.add(id, UUID.fromString(input.userId()), ConversationParticipant.ParticipantRole.MEMBER);
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + id + "/participants/" + participant.getId())).body(participant);
    }

    private UUID actorId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}

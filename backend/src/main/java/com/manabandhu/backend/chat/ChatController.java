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
    Conversation getConversation(@PathVariable UUID id) {
        return conversationService.find(id);
    }

    @PostMapping("/conversations")
    ResponseEntity<Conversation> createConversation(Authentication authentication, @Valid @RequestBody CreateConversationInput input) {
        var type = Conversation.ConversationType.valueOf(input.type());
        var conversation = conversationService.create(UUID.fromString(authentication.getName()), type, input.title());
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + conversation.getId())).body(conversation);
    }

    @GetMapping("/conversations/{id}/messages")
    List<Message> messages(@PathVariable UUID id) {
        return messageService.findByConversation(id);
    }

    @PostMapping("/conversations/{id}/messages")
    ResponseEntity<Message> sendMessage(Authentication authentication, @PathVariable UUID id, @Valid @RequestBody SendMessageInput input) {
        var messageType = Message.MessageType.valueOf(input.messageType());
        var message = messageService.send(id, UUID.fromString(authentication.getName()), input.body(), messageType);
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + id + "/messages/" + message.getId())).body(message);
    }

    @GetMapping("/conversations/{id}/participants")
    List<ConversationParticipant> participants(@PathVariable UUID id) {
        return participantService.findByConversation(id);
    }

    @PostMapping("/conversations/{id}/participants")
    ResponseEntity<ConversationParticipant> addParticipant(@PathVariable UUID id, @RequestBody AddParticipantInput input) {
        var participant = participantService.add(id, UUID.fromString(input.userId()), ConversationParticipant.ParticipantRole.MEMBER);
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + id + "/participants/" + participant.getId())).body(participant);
    }
}

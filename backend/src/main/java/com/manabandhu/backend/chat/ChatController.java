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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

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
        return conversationService.findByParticipant(Actor.require(authentication).id());
    }

    @GetMapping("/conversations/{id}")
    Conversation getConversation(Authentication authentication, @PathVariable UUID id) {
        participantService.requireParticipant(Actor.require(authentication), id);
        return conversationService.find(id);
    }

    @PostMapping("/conversations")
    ResponseEntity<Conversation> createConversation(Authentication authentication, @Valid @RequestBody CreateConversationInput input) {
        var type = Conversation.ConversationType.valueOf(input.type());
        var conversation = conversationService.createAs(Actor.require(authentication), type, input.title());
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + conversation.getId())).body(conversation);
    }

    @GetMapping("/conversations/{id}/messages")
    List<Message> messages(Authentication authentication, @PathVariable UUID id,
                           @RequestParam(required = false) Integer limit) {
        return messageService.listFor(Actor.require(authentication), id, limit);
    }

    @PostMapping("/conversations/{id}/messages")
    ResponseEntity<Message> sendMessage(Authentication authentication, @PathVariable UUID id, @Valid @RequestBody SendMessageInput input) {
        var messageType = Message.MessageType.valueOf(input.messageType());
        var message = messageService.sendAs(Actor.require(authentication), id, input.body(), messageType);
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + id + "/messages/" + message.getId())).body(message);
    }

    @GetMapping("/conversations/{id}/participants")
    List<ConversationParticipant> participants(Authentication authentication, @PathVariable UUID id) {
        return participantService.listFor(Actor.require(authentication), id);
    }

    @PostMapping("/conversations/{id}/participants")
    ResponseEntity<ConversationParticipant> addParticipant(Authentication authentication, @PathVariable UUID id,
                                                           @Valid @RequestBody AddParticipantInput input) {
        var participant = participantService.invite(Actor.require(authentication), id, UUID.fromString(input.userId()));
        return ResponseEntity.created(URI.create("/api/v1/chat/conversations/" + id + "/participants/" + participant.getId())).body(participant);
    }
}

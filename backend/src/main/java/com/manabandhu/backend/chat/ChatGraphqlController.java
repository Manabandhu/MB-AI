package com.manabandhu.backend.chat;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class ChatGraphqlController {

    private final ConversationService conversationService;
    private final MessageService messageService;
    private final ConversationParticipantService participantService;

    ChatGraphqlController(ConversationService conversationService, MessageService messageService, ConversationParticipantService participantService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.participantService = participantService;
    }

    @QueryMapping
    List<Conversation> conversations(Authentication authentication) {
        return conversationService.findByParticipant(UUID.fromString(authentication.getName()));
    }

    @QueryMapping
    Conversation conversation(@Argument UUID id) {
        return conversationService.find(id);
    }

    @MutationMapping
    Conversation createConversation(Authentication authentication, @Argument @Valid CreateConversationInput input) {
        var type = Conversation.ConversationType.valueOf(input.type());
        return conversationService.create(UUID.fromString(authentication.getName()), type, input.title());
    }

    @QueryMapping
    List<Message> messages(@Argument UUID conversationId) {
        return messageService.findByConversation(conversationId);
    }

    @MutationMapping
    Message sendMessage(Authentication authentication, @Argument UUID conversationId, @Argument @Valid SendMessageInput input) {
        var messageType = Message.MessageType.valueOf(input.messageType());
        return messageService.send(conversationId, UUID.fromString(authentication.getName()), input.body(), messageType);
    }

    @QueryMapping
    List<ConversationParticipant> participants(@Argument UUID conversationId) {
        return participantService.findByConversation(conversationId);
    }
}

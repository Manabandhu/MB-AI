package com.manabandhu.backend.ai;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class AiGraphqlController {

    private final AssistantConversationService conversationService;
    private final AssistantMessageService messageService;
    private final AssistantCitationService citationService;

    AiGraphqlController(AssistantConversationService conversationService, AssistantMessageService messageService, AssistantCitationService citationService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.citationService = citationService;
    }

    @QueryMapping
    List<AssistantConversation> assistantConversations(Authentication authentication) {
        return conversationService.findByUser(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    AssistantConversation createAssistantConversation(Authentication authentication, @Argument @Valid CreateConversationRequest input) {
        return conversationService.create(UUID.fromString(authentication.getName()), input.title());
    }

    @QueryMapping
    List<AssistantMessage> assistantMessages(@Argument UUID conversationId) {
        return messageService.findByConversation(conversationId);
    }

    @MutationMapping
    AssistantMessage sendAssistantMessage(@Argument UUID conversationId, @Argument @Valid SendAssistantMessageInput input) {
        return messageService.send(conversationId, AssistantMessage.MessageRole.USER, input.content());
    }

    @QueryMapping
    List<AssistantCitation> assistantCitations(@Argument UUID messageId) {
        return citationService.findByMessage(messageId);
    }

    @MutationMapping
    AssistantCitation createAssistantCitation(@Argument UUID messageId, @Argument @Valid CreateAssistantCitationInput input) {
        return citationService.create(messageId, input.title(), input.url(), input.snippet());
    }
}

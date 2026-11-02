package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.Paging;
import com.manabandhu.backend.notifications.Notification;
import com.manabandhu.backend.notifications.NotificationPublisher;

@Service
public class MessageService {

    static final int DEFAULT_PAGE_SIZE = 100;
    static final int MAX_PAGE_SIZE = 200;

    private final MessageRepository repository;
    private final ConversationService conversationService;
    private final ConversationParticipantService participantService;
    private final NotificationPublisher notifications;

    MessageService(MessageRepository repository, ConversationService conversationService,
                   ConversationParticipantService participantService, NotificationPublisher notifications) {
        this.notifications = notifications;
        this.repository = repository;
        this.conversationService = conversationService;
        this.participantService = participantService;
    }

    /** Newest-first page of messages for a participant; the page size is capped. */
    @Transactional(readOnly = true)
    public List<Message> listFor(Actor actor, UUID conversationId, Integer limit) {
        participantService.requireParticipant(actor, conversationId);
        var size = Paging.clamp(limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        return repository.findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(0, size));
    }

    /** User-sent messages; SYSTEM messages are reserved for the server. */
    @Transactional
    public Message sendAs(Actor actor, UUID conversationId, String body, Message.MessageType messageType) {
        participantService.requireParticipant(actor, conversationId);
        if (messageType == Message.MessageType.SYSTEM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SYSTEM messages cannot be sent by users");
        }
        var message = send(conversationId, actor.id(), body, messageType);
        // The message text stays in the chat; notifications (and pushes on lock screens) only say who wrote.
        var recipients = participantService.findByConversation(conversationId).stream()
                .map(ConversationParticipant::getUserId).toList();
        notifications.publishAll(recipients, actor.id(), Notification.NotificationType.CHAT, "New message",
                "You have a new message.", "/chat/" + conversationId);
        return message;
    }

    /** Server-side send used by trusted flows such as room inquiries and ride chat provisioning. */
    @Transactional
    public Message send(UUID conversationId, UUID senderId, String body, Message.MessageType messageType) {
        var message = repository.save(new Message(conversationId, senderId, body, messageType));
        conversationService.updateLastMessageAt(conversationId, Instant.now());
        return message;
    }
}

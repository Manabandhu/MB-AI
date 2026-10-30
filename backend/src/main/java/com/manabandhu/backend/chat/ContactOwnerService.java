package com.manabandhu.backend.chat;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.notifications.Notification;
import com.manabandhu.backend.notifications.NotificationPublisher;

/**
 * Opens the conversation a member starts with the owner of a listing, room, or referral: creates the chat, adds the
 * owner, posts the requester's first message, and notifies the owner. Callers decide who may contact whom (their own
 * access checks) and whether an earlier conversation should be reused; this class only does the chat plumbing so the
 * flows stay identical across modules.
 */
@Service
public class ContactOwnerService {

    /** Conversation titles are stored in a 200-character column. */
    static final int MAX_TITLE_LENGTH = 200;

    /** What to open and how to tell the owner. */
    public record Contact(
            UUID requesterId,
            UUID ownerId,
            Conversation.ConversationType type,
            String title,
            String firstMessage,
            Notification.NotificationType notificationType,
            String notificationTitle,
            String notificationBody) {}

    private final ConversationService conversations;
    private final ConversationParticipantService participants;
    private final MessageService messages;
    private final NotificationPublisher notifications;

    public ContactOwnerService(ConversationService conversations, ConversationParticipantService participants,
                        MessageService messages, NotificationPublisher notifications) {
        this.conversations = conversations;
        this.participants = participants;
        this.messages = messages;
        this.notifications = notifications;
    }

    /** Creates a new conversation for {@code contact} and returns its id. */
    @Transactional
    public UUID open(Contact contact) {
        var conversation = conversations.create(contact.requesterId(), contact.type(), truncate(contact.title()));
        participants.add(conversation.getId(), contact.ownerId(), ConversationParticipant.ParticipantRole.MEMBER);
        post(conversation.getId(), contact);
        return conversation.getId();
    }

    /** Posts {@code contact}'s message into an existing conversation and notifies the owner. */
    @Transactional
    public void post(UUID conversationId, Contact contact) {
        messages.send(conversationId, contact.requesterId(), contact.firstMessage(), Message.MessageType.TEXT);
        notifications.publish(contact.ownerId(), contact.requesterId(), contact.notificationType(),
                contact.notificationTitle(), contact.notificationBody(), "/chat/" + conversationId);
    }

    static String truncate(String title) {
        return title.length() > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH) : title;
    }
}

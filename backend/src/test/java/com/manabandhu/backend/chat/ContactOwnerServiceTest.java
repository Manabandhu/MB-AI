package com.manabandhu.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.manabandhu.backend.notifications.Notification;
import com.manabandhu.backend.notifications.NotificationPublisher;

class ContactOwnerServiceTest {

    private final ConversationService conversations = mock(ConversationService.class);
    private final ConversationParticipantService participants = mock(ConversationParticipantService.class);
    private final MessageService messages = mock(MessageService.class);
    private final NotificationPublisher notifications = mock(NotificationPublisher.class);
    private final ContactOwnerService service =
            new ContactOwnerService(conversations, participants, messages, notifications);
    private final UUID requester = UUID.randomUUID();
    private final UUID owner = UUID.randomUUID();

    private ContactOwnerService.Contact contact(String title) {
        return new ContactOwnerService.Contact(requester, owner, Conversation.ConversationType.DIRECT, title,
                "Is it still available?", Notification.NotificationType.CHAT, "New message", "Someone asked.");
    }

    @Test
    void openCreatesTheChatAddsTheOwnerSendsAndNotifies() {
        var conversation = mock(Conversation.class);
        var conversationId = UUID.randomUUID();
        when(conversation.getId()).thenReturn(conversationId);
        when(conversations.create(eq(requester), eq(Conversation.ConversationType.DIRECT), anyString()))
                .thenReturn(conversation);

        assertThat(service.open(contact("Marketplace: Desk"))).isEqualTo(conversationId);

        verify(participants).add(conversationId, owner, ConversationParticipant.ParticipantRole.MEMBER);
        verify(messages).send(conversationId, requester, "Is it still available?", Message.MessageType.TEXT);
        verify(notifications).publish(owner, requester, Notification.NotificationType.CHAT, "New message",
                "Someone asked.", "/chat/" + conversationId);
    }

    @Test
    void postReusesAnExistingChatWithoutCreatingOne() {
        var existing = UUID.randomUUID();
        service.post(existing, contact("Referral: Backend role"));

        verify(conversations, never()).create(any(), any(), any());
        verify(messages).send(existing, requester, "Is it still available?", Message.MessageType.TEXT);
        verify(notifications).publish(eq(owner), eq(requester), any(), any(), any(), eq("/chat/" + existing));
    }

    @Test
    void titlesAreCutToTheColumnLength() {
        assertThat(ContactOwnerService.truncate("x".repeat(250))).hasSize(ContactOwnerService.MAX_TITLE_LENGTH);
        assertThat(ContactOwnerService.truncate("short")).isEqualTo("short");
    }
}

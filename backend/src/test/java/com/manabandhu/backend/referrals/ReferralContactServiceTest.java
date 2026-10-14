package com.manabandhu.backend.referrals;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;
import com.manabandhu.backend.notifications.NotificationPublisher;

class ReferralContactServiceTest {

    private final ReferralRepository referrals = mock(ReferralRepository.class);
    private final ConversationService conversations = mock(ConversationService.class);
    private final ConversationParticipantService participants = mock(ConversationParticipantService.class);
    private final MessageService messages = mock(MessageService.class);
    private final ReferralContactService service = spy(new ReferralContactService(referrals, conversations,
            participants, messages, mock(NotificationPublisher.class), mock(JdbcTemplate.class)));
    private final UUID ownerId = UUID.randomUUID();
    private final Actor caller = new Actor(UUID.randomUUID(), false, false);
    private static final String PITCH = "Hi, I am a backend engineer looking for a referral.";

    private Referral referral(String status) {
        var referral = new Referral(ownerId, null, "offer", "SWE at Acme", "d", status);
        when(referrals.findById(referral.getId())).thenReturn(Optional.of(referral));
        return referral;
    }

    private static int status(Throwable error) {
        return ((ResponseStatusException) error).getStatusCode().value();
    }

    @Test
    void createsADirectChatWithBothPeopleAndSendsTheMessage() {
        var referral = referral("pending");
        var conversation = mock(Conversation.class);
        var conversationId = UUID.randomUUID();
        when(conversation.getId()).thenReturn(conversationId);
        doReturn(null).when(service).existingDirect(caller.id(), ownerId);
        when(conversations.create(eq(caller.id()), eq(Conversation.ConversationType.DIRECT), anyString()))
                .thenReturn(conversation);

        assertThat(service.contact(caller, referral.getId(), PITCH)).isEqualTo(conversationId);

        verify(participants).add(conversationId, caller.id(), ConversationParticipant.ParticipantRole.MEMBER);
        verify(participants).add(conversationId, ownerId, ConversationParticipant.ParticipantRole.MEMBER);
        verify(messages).send(eq(conversationId), eq(caller.id()), anyString(), eq(Message.MessageType.TEXT));
    }

    @Test
    void reusesTheExistingDirectChat() {
        var referral = referral("open");
        var existing = UUID.randomUUID();
        doReturn(existing).when(service).existingDirect(caller.id(), ownerId);

        assertThat(service.contact(caller, referral.getId(), PITCH)).isEqualTo(existing);

        verify(conversations, never()).create(any(), any(), any());
        verify(messages).send(eq(existing), eq(caller.id()), anyString(), eq(Message.MessageType.TEXT));
    }

    @Test
    void ownerCannotContactThemselves() {
        var referral = referral("open");
        var owner = new Actor(ownerId, false, false);
        assertThatThrownBy(() -> service.contact(owner, referral.getId(), PITCH))
                .satisfies(e -> assertThat(status(e)).isEqualTo(400));
        verify(messages, never()).send(any(), any(), any(), any());
    }

    @Test
    void closedReferralIsHiddenFromOthers() {
        var referral = referral("closed");
        assertThatThrownBy(() -> service.contact(caller, referral.getId(), PITCH))
                .satisfies(e -> assertThat(status(e)).isEqualTo(404));
    }

    @Test
    void shortMessageIs400AndMissingReferralIs404() {
        var referral = referral("open");
        assertThatThrownBy(() -> service.contact(caller, referral.getId(), "  hi  "))
                .satisfies(e -> assertThat(status(e)).isEqualTo(400));
        var missing = UUID.randomUUID();
        when(referrals.findById(missing)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.contact(caller, missing, PITCH))
                .satisfies(e -> assertThat(status(e)).isEqualTo(404));
    }
}

package com.manabandhu.backend.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.audit.AdminAuditService;

/** Unread counts and mark-read against a real (H2, PostgreSQL mode) database, through the services. */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.datasource.url=jdbc:h2:mem:chatreadstate;MODE=PostgreSQL;DB_CLOSE_DELAY=-1"
})
class ChatReadStateTest {

    @Autowired ConversationRepository conversations;
    @Autowired ConversationParticipantRepository participants;
    @Autowired MessageRepository messages;

    private final AdminAuditService audit = mock(AdminAuditService.class);
    private ConversationService service;

    private final Instant t0 = Instant.now().truncatedTo(ChronoUnit.MILLIS).minus(1, ChronoUnit.HOURS);
    private final Actor alice = new Actor(UUID.randomUUID(), false, false);
    private final Actor bob = new Actor(UUID.randomUUID(), false, false);
    private final Actor stranger = new Actor(UUID.randomUUID(), false, false);
    private final Actor admin = new Actor(UUID.randomUUID(), true, false);
    private UUID conversationId;

    @BeforeEach
    void setUp() {
        var participantService = new ConversationParticipantService(participants, audit);
        service = new ConversationService(conversations, participants, messages, participantService);
        conversationId = conversations.save(new Conversation(Conversation.ConversationType.DIRECT, "t")).getId();
        join(alice, t0);
        join(bob, t0);
    }

    private void join(Actor actor, Instant at) {
        var p = new ConversationParticipant(conversationId, actor.id(), ConversationParticipant.ParticipantRole.MEMBER);
        ReflectionTestUtils.setField(p, "joinedAt", at);
        participants.saveAndFlush(p);
    }

    private Message post(Actor sender, int minutesAfterStart) {
        var m = new Message(conversationId, sender.id(), "m" + minutesAfterStart, Message.MessageType.TEXT);
        ReflectionTestUtils.setField(m, "createdAt", t0.plus(minutesAfterStart, ChronoUnit.MINUTES));
        return messages.saveAndFlush(m);
    }

    private int listedUnread(Actor actor) {
        return service.findByParticipant(actor.id()).stream()
                .filter(c -> c.getId().equals(conversationId)).findFirst().orElseThrow().getUnreadCount();
    }

    @Test
    void unreadCountsOnlyOtherPeoplesMessages() {
        post(bob, 1);
        post(bob, 2);
        post(alice, 3);

        assertThat(listedUnread(alice)).isEqualTo(2);
        assertThat(listedUnread(bob)).isEqualTo(1);
        assertThat(service.findFor(alice, conversationId).getUnreadCount()).isEqualTo(2);
    }

    @Test
    void conversationsWithNothingUnreadReportZero() {
        post(alice, 1);
        assertThat(listedUnread(alice)).isZero();
    }

    @Test
    void messagesBeforeJoiningAreNotUnread() {
        var late = new Actor(UUID.randomUUID(), false, false);
        post(bob, 1);
        join(late, t0.plus(5, ChronoUnit.MINUTES));
        post(bob, 10);

        assertThat(listedUnread(late)).isEqualTo(1);
    }

    @Test
    void markReadUpToAMessageRespectsLaterMessages() {
        var first = post(bob, 1);
        post(bob, 2);

        var state = service.markRead(alice, conversationId, first.getId());

        assertThat(state.unreadCount()).isEqualTo(1);
        assertThat(state.lastReadAt()).isEqualTo(first.getCreatedAt());
        assertThat(listedUnread(alice)).isEqualTo(1);
        assertThat(listedUnread(bob)).isZero();
    }

    @Test
    void markReadWithoutAMessageClearsEverything() {
        post(bob, 1);
        post(bob, 2);

        assertThat(service.markRead(alice, conversationId, null).unreadCount()).isZero();
        assertThat(listedUnread(alice)).isZero();
    }

    @Test
    void markReadNeverMovesBackwards() {
        var first = post(bob, 1);
        var second = post(bob, 2);

        service.markRead(alice, conversationId, second.getId());
        var state = service.markRead(alice, conversationId, first.getId());

        assertThat(state.lastReadAt()).isEqualTo(second.getCreatedAt());
        assertThat(state.unreadCount()).isZero();
    }

    @Test
    void strangersCannotMarkRead() {
        post(bob, 1);
        assertThatThrownBy(() -> service.markRead(stranger, conversationId, null))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(listedUnread(alice)).isEqualTo(1);
    }

    @Test
    void adminsWhoAreNotMembersHaveNoReadState() {
        assertThatThrownBy(() -> service.markRead(admin, conversationId, null))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(audit);
        // Reading the conversation is allowed (and audited) but carries no unread count.
        assertThat(service.findFor(admin, conversationId).getUnreadCount()).isNull();
    }

    @Test
    void participantsWhoLeftCannotMarkRead() {
        participants.findByConversationIdAndUserId(conversationId, bob.id()).orElseThrow().leave();
        participants.flush();
        assertThatThrownBy(() -> service.markRead(bob, conversationId, null))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void markReadRejectsAMessageFromAnotherConversation() {
        var other = conversations.save(new Conversation(Conversation.ConversationType.DIRECT, "o")).getId();
        var foreign = messages.saveAndFlush(new Message(other, bob.id(), "x", Message.MessageType.TEXT));

        assertThatThrownBy(() -> service.markRead(alice, conversationId, foreign.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void strangersCannotReadTheConversation() {
        assertThatThrownBy(() -> service.findFor(stranger, conversationId))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}

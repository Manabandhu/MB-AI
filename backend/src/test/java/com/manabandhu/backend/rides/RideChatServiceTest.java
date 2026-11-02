package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;

import org.junit.jupiter.api.Test;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;

class RideChatServiceTest {

    private final RideOfferService offers = mock(RideOfferService.class);
    private final RideBookingService bookings = mock(RideBookingService.class);
    private final ConversationService conversations = mock(ConversationService.class);
    private final ConversationParticipantService participants = mock(ConversationParticipantService.class);
    private final MessageService messages = mock(MessageService.class);
    private final RideChatService service =
            new RideChatService(offers, bookings, conversations, participants, messages);

    private final UUID offerId = UUID.randomUUID();
    private final UUID driverId = UUID.randomUUID();
    private final RideOffer offer = mock(RideOffer.class);

    private RideBooking booking(UUID userId) {
        var booking = mock(RideBooking.class);
        when(booking.getUserId()).thenReturn(userId);
        return booking;
    }

    @Test
    @SuppressWarnings("unchecked")
    void firstCallCreatesTheChatWithConfirmedPassengersOnly() {
        var passenger = UUID.randomUUID();
        var conversation = mock(Conversation.class);
        var conversationId = UUID.randomUUID();
        when(conversation.getId()).thenReturn(conversationId);
        when(offer.getDriverId()).thenReturn(driverId);
        when(offer.getOriginArea()).thenReturn("Irving");
        when(offer.getDestinationArea()).thenReturn("Austin");
        when(offers.findById(offerId)).thenReturn(Optional.of(offer));
        when(offers.attachConversation(eq(offerId), any()))
                .thenAnswer(inv -> ((Function<RideOffer, UUID>) inv.getArgument(1)).apply(offer));
        when(conversations.create(eq(driverId), eq(Conversation.ConversationType.RIDE_TEMP), anyString()))
                .thenReturn(conversation);
        // The query only returns confirmed bookings; a driver row (if any) must still be skipped.
        // ConversationService.create makes the driver the OWNER participant.
        when(participants.isParticipant(conversationId, driverId)).thenReturn(true);
        var confirmed = List.of(booking(passenger), booking(driverId));
        when(bookings.findConfirmedByRideId(offerId)).thenReturn(confirmed);

        var response = service.provision(new Actor(driverId, false, false), offerId);

        assertThat(response.conversationId()).isEqualTo(conversationId);
        verify(participants).add(conversationId, passenger, ConversationParticipant.ParticipantRole.MEMBER);
        verify(participants, never()).add(conversationId, driverId, ConversationParticipant.ParticipantRole.MEMBER);
        verify(messages).send(eq(conversationId), eq(driverId), anyString(), eq(Message.MessageType.SYSTEM));
    }

    @Test
    void laterCallsReuseTheChatAndJoinTheCaller() {
        var rider = UUID.randomUUID();
        var existing = UUID.randomUUID();
        when(offers.findById(offerId)).thenReturn(Optional.of(offer));
        when(offers.attachConversation(eq(offerId), any())).thenReturn(existing);

        var response = service.provision(new Actor(rider, false, false), offerId);

        assertThat(response.conversationId()).isEqualTo(existing);
        verify(conversations, never()).create(any(), any(), any());
        verify(bookings, never()).findConfirmedByRideId(any());
        verify(participants).add(existing, rider, ConversationParticipant.ParticipantRole.MEMBER);
    }
}

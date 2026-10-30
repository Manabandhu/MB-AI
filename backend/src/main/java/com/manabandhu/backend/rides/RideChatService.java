package com.manabandhu.backend.rides;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;

/**
 * The temporary group chat for one ride (driver plus confirmed passengers). Created once under the offer row lock
 * ({@link RideOfferService#attachConversation}); later callers who are ride members join it.
 */
@Service
public class RideChatService {

    static final String EPHEMERAL_NOTICE =
            "🔒 Ephemeral Chat: This conversation will automatically self-delete 2 hours after ride completion.";

    private final RideOfferService offerService;
    private final RideBookingService bookingService;
    private final ConversationService conversationService;
    private final ConversationParticipantService participantService;
    private final MessageService messageService;

    RideChatService(RideOfferService offerService, RideBookingService bookingService,
                    ConversationService conversationService, ConversationParticipantService participantService,
                    MessageService messageService) {
        this.offerService = offerService;
        this.bookingService = bookingService;
        this.conversationService = conversationService;
        this.participantService = participantService;
        this.messageService = messageService;
    }

    /**
     * Returns the ride's chat (creating it on first use) after checking that {@code actor} is a ride member.
     * Deliberately not {@code @Transactional}: {@link RideOfferService#attachConversation} must start its own
     * transaction so its {@code SELECT … FOR UPDATE} reads the current conversation id instead of the copy loaded
     * above; otherwise two concurrent first calls would each create a chat.
     */
    public RideChatResponse provision(Actor actor, UUID offerId) {
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        // Only the driver and passengers with a live booking or accepted request may join the ride chat.
        offerService.requireRideMember(actor, offer);

        var conversationId = offerService.attachConversation(offerId, locked -> {
            var title = "Ride: " + locked.getOriginArea() + " → " + locked.getDestinationArea();
            var conversation = conversationService.create(locked.getDriverId(), Conversation.ConversationType.RIDE_TEMP, title);
            // Bookings are pending/confirmed/cancelled; riders with an accepted request join on their own first call.
            for (var booking : bookingService.findByRideId(offerId)) {
                if ("confirmed".equalsIgnoreCase(booking.getStatus()) && !booking.getUserId().equals(locked.getDriverId())) {
                    participantService.add(conversation.getId(), booking.getUserId(), ConversationParticipant.ParticipantRole.MEMBER);
                }
            }
            String initialNotice = String.format(
                    "🚗 Ride Coordination Chat created for %s → %s.\n\n" +
                    "🔒 Ephemeral Notice: This chat is temporary and will permanently self-delete 2 hours after the ride is marked completed.",
                    locked.getOriginArea(), locked.getDestinationArea()
            );
            messageService.send(conversation.getId(), locked.getDriverId(), initialNotice, Message.MessageType.SYSTEM);
            return conversation.getId();
        });

        if (!participantService.isParticipant(conversationId, actor.id())) {
            participantService.add(conversationId, actor.id(), ConversationParticipant.ParticipantRole.MEMBER);
        }
        return new RideChatResponse(conversationId, offerId, offer.getChatExpiresAt(), EPHEMERAL_NOTICE);
    }
}

package com.manabandhu.backend.rooms;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.ContactOwnerService;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;
import com.manabandhu.backend.notifications.Notification;

/** A member asks a host about an active listing: opens a chat with an intro message and notifies the host. */
@Service
public class RoomInquiryService {

    private final RoomListingService listingService;
    private final RoomInquiryRepository repository;
    private final ConversationParticipantService participantService;
    private final MessageService messageService;
    private final ContactOwnerService contacts;

    RoomInquiryService(RoomListingService listingService, RoomInquiryRepository repository,
                       ConversationParticipantService participantService, MessageService messageService,
                       ContactOwnerService contacts) {
        this.listingService = listingService;
        this.repository = repository;
        this.participantService = participantService;
        this.messageService = messageService;
        this.contacts = contacts;
    }

    @Transactional
    public RoomInquiryResponse inquire(Actor actor, UUID roomId, RoomInquiryInput input) {
        var senderId = actor.id();
        var listing = listingService.findPublishedById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        var hostId = listing.getOwnerId();

        if (senderId.equals(hostId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot inquire about your own room listing");
        }
        if (!"active".equals(listing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This listing is not accepting inquiries right now");
        }
        // The client sends its own local date; UTC-12 is the last place where "today" is still today.
        if (input.moveInDate().isBefore(java.time.LocalDate.now(java.time.ZoneOffset.ofHours(-12)))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Move-in date cannot be in the past");
        }

        var introText = introText(listing, input);

        // A repeat inquiry goes into the existing chat instead of opening (and notifying) a new one each time.
        var previous = repository.findFirstByRoomIdAndSenderIdOrderByCreatedAtDesc(roomId, senderId)
                .filter(p -> p.getConversationId() != null
                        && participantService.isParticipant(p.getConversationId(), senderId)
                        && participantService.isParticipant(p.getConversationId(), hostId));
        if (previous.isPresent()) {
            var inquiry = previous.get();
            messageService.send(inquiry.getConversationId(), senderId, introText, Message.MessageType.TEXT);
            return new RoomInquiryResponse(inquiry.getId(), inquiry.getConversationId());
        }

        var conversationId = contacts.open(new ContactOwnerService.Contact(
                senderId, hostId, Conversation.ConversationType.ROOM_INQUIRY, "Room Inquiry: " + listing.getTitle(),
                introText, Notification.NotificationType.ROOM, "New room inquiry",
                "Someone asked about \"" + listing.getTitle() + "\"."));

        var inquiry = repository.save(new RoomInquiry(
                roomId, senderId, hostId, conversationId,
                input.moveInDate(), input.stayDurationMonths(),
                input.dietaryLifestyle(), input.introMessage()
        ));
        return new RoomInquiryResponse(inquiry.getId(), conversationId);
    }

    private static String introText(RoomListing listing, RoomInquiryInput input) {
        return String.format(
                "👋 Room Inquiry for \"%s\" ($%s/mo)%n%n"
                        + "📅 Preferred Move-In: %s%n"
                        + "⏳ Stay Duration: %s%n"
                        + "🥗 Dietary Preference: %s%n%n"
                        + "💬 Message: %s",
                listing.getTitle(),
                listing.getPrice() != null ? listing.getPrice().toPlainString() : "N/A",
                input.moveInDate(),
                input.stayDurationMonths() != null ? input.stayDurationMonths() + " months" : "Flexible",
                input.dietaryLifestyle() != null ? input.dietaryLifestyle() : "Flexible",
                input.introMessage().trim());
    }
}

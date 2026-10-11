package com.manabandhu.backend.rooms;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;
import com.manabandhu.backend.notifications.Notification;
import com.manabandhu.backend.notifications.NotificationPublisher;

/** A member asks a host about an active listing: opens a chat with an intro message and notifies the host. */
@Service
public class RoomInquiryService {

    private final RoomListingService listingService;
    private final RoomInquiryRepository repository;
    private final ConversationService conversationService;
    private final ConversationParticipantService participantService;
    private final MessageService messageService;
    private final NotificationPublisher notifications;

    RoomInquiryService(RoomListingService listingService, RoomInquiryRepository repository,
                       ConversationService conversationService, ConversationParticipantService participantService,
                       MessageService messageService, NotificationPublisher notifications) {
        this.listingService = listingService;
        this.repository = repository;
        this.conversationService = conversationService;
        this.participantService = participantService;
        this.messageService = messageService;
        this.notifications = notifications;
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

        // Create direct conversation for room inquiry with title
        var title = "Room Inquiry: " + listing.getTitle();
        var conversation = conversationService.create(senderId, Conversation.ConversationType.ROOM_INQUIRY, title);
        participantService.add(conversation.getId(), hostId, ConversationParticipant.ParticipantRole.MEMBER);

        // Format and post intro chat message
        String introText = String.format(
                "👋 Room Inquiry for \"%s\" ($%s/mo)\n\n" +
                "📅 Preferred Move-In: %s\n" +
                "⏳ Stay Duration: %d months\n" +
                "🥗 Dietary Preference: %s\n\n" +
                "💬 Message: %s",
                listing.getTitle(),
                listing.getPrice() != null ? listing.getPrice().toPlainString() : "N/A",
                input.moveInDate(),
                input.stayDurationMonths() != null ? input.stayDurationMonths() : 6,
                input.dietaryLifestyle() != null ? input.dietaryLifestyle() : "Flexible",
                input.introMessage()
        );
        messageService.send(conversation.getId(), senderId, introText, Message.MessageType.TEXT);

        // Record room inquiry
        var inquiry = repository.save(new RoomInquiry(
                roomId, senderId, hostId, conversation.getId(),
                input.moveInDate(), input.stayDurationMonths(),
                input.dietaryLifestyle(), input.introMessage()
        ));

        notifications.publish(hostId, senderId, Notification.NotificationType.ROOM, "New room inquiry",
                "Someone asked about \"" + listing.getTitle() + "\".", "/chat/" + conversation.getId());
        return new RoomInquiryResponse(inquiry.getId(), conversation.getId());
    }
}

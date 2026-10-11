package com.manabandhu.backend.marketplace;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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

/**
 * "Chat with seller": opens a direct chat between the buyer and the seller about one listing, or returns the one
 * that already exists ({@code listing_conversations}). The seller's identity never reaches the buyer otherwise.
 */
@Service
public class ListingContactService {

    public record ListingContactResponse(UUID conversationId, boolean created) {}

    private final JdbcTemplate jdbc;
    private final ListingService listingService;
    private final ConversationService conversations;
    private final ConversationParticipantService participants;
    private final MessageService messages;
    private final NotificationPublisher notifications;

    ListingContactService(JdbcTemplate jdbc, ListingService listingService, ConversationService conversations,
                          ConversationParticipantService participants, MessageService messages,
                          NotificationPublisher notifications) {
        this.jdbc = jdbc;
        this.listingService = listingService;
        this.conversations = conversations;
        this.participants = participants;
        this.messages = messages;
        this.notifications = notifications;
    }

    @Transactional
    public ListingContactResponse contact(Actor actor, UUID listingId) {
        var listing = listingService.requireVisible(listingId, actor);
        if (actor.is(listing.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This is your own listing");
        }
        var existing = jdbc.queryForList(
                "SELECT conversation_id FROM public.listing_conversations WHERE listing_id = ? AND buyer_id = ?",
                UUID.class, listingId, actor.id());
        if (!existing.isEmpty() && participants.isParticipant(existing.getFirst(), actor.id())) {
            return new ListingContactResponse(existing.getFirst(), false);
        }
        if (!"active".equals(listing.getStatus()) && !"reserved".equals(listing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This item is no longer available");
        }
        var conversation = conversations.create(actor.id(), Conversation.ConversationType.DIRECT,
                "Marketplace: " + listing.getTitle());
        participants.add(conversation.getId(), listing.getOwnerId(), ConversationParticipant.ParticipantRole.MEMBER);
        messages.send(conversation.getId(), actor.id(),
                "Hi! I'm interested in \"" + listing.getTitle() + "\". Is it still available?", Message.MessageType.TEXT);
        jdbc.update("""
                INSERT INTO public.listing_conversations (listing_id, buyer_id, conversation_id) VALUES (?, ?, ?)
                ON CONFLICT (listing_id, buyer_id) DO UPDATE SET conversation_id = EXCLUDED.conversation_id
                """, listingId, actor.id(), conversation.getId());
        notifications.publish(listing.getOwnerId(), actor.id(), Notification.NotificationType.CHAT,
                "New message about your listing", "Someone asked about \"" + listing.getTitle() + "\".",
                "/chat/" + conversation.getId());
        return new ListingContactResponse(conversation.getId(), true);
    }
}

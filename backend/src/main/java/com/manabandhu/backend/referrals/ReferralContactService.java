package com.manabandhu.backend.referrals;

import java.util.Locale;
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
 * A member contacts the poster of an open referral: reuses their direct chat (or opens one), sends the message,
 * and notifies the poster, all in one transaction. Only open referrals, never your own.
 */
@Service
public class ReferralContactService {

    private final ReferralRepository referrals;
    private final ConversationService conversationService;
    private final ConversationParticipantService participantService;
    private final MessageService messageService;
    private final NotificationPublisher notifications;
    private final JdbcTemplate jdbcTemplate;

    ReferralContactService(ReferralRepository referrals, ConversationService conversationService,
                           ConversationParticipantService participantService, MessageService messageService,
                           NotificationPublisher notifications, JdbcTemplate jdbcTemplate) {
        this.referrals = referrals;
        this.conversationService = conversationService;
        this.participantService = participantService;
        this.messageService = messageService;
        this.notifications = notifications;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public UUID contact(Actor actor, UUID referralId, String message) {
        var referral = referrals.findById(referralId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referral not found"));
        var ownerId = referral.getOwnerId();
        var status = referral.getStatus() == null ? "" : referral.getStatus().toLowerCase(Locale.ROOT);
        var open = ReferralsContentService.OPEN_STATUSES.contains(status);
        if (!open && !actor.is(ownerId) && !actor.admin()) {
            // Closed referrals are hidden from other members, as on GET /{id}.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Referral not found");
        }
        if (actor.is(ownerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot contact yourself about your own referral");
        }
        if (!open) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This referral is closed");
        }
        var text = message == null ? "" : message.trim();
        if (text.length() < 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Write at least 20 characters");
        }

        var conversationId = existingDirect(actor.id(), ownerId);
        if (conversationId == null) {
            var title = ("Referral: " + referral.getTitle());
            var conversation = conversationService.create(actor.id(), Conversation.ConversationType.DIRECT,
                    title.length() > 200 ? title.substring(0, 200) : title);
            conversationId = conversation.getId();
        }
        participantService.add(conversationId, actor.id(), ConversationParticipant.ParticipantRole.MEMBER);
        participantService.add(conversationId, ownerId, ConversationParticipant.ParticipantRole.MEMBER);
        var body = "About your referral \"" + referral.getTitle() + "\":\n\n" + text;
        messageService.send(conversationId, actor.id(), body, Message.MessageType.TEXT);
        notifications.publish(ownerId, actor.id(), Notification.NotificationType.REFERRAL, "New referral message",
                "Someone messaged you about \"" + referral.getTitle() + "\".", "/chat/" + conversationId);
        return conversationId;
    }

    /** The newest direct chat in which exactly these two people are active participants, or null. */
    UUID existingDirect(UUID a, UUID b) {
        return jdbcTemplate.query("""
                SELECT c.id FROM public.conversations c
                JOIN public.conversation_participants pa
                  ON pa.conversation_id = c.id AND pa.user_id = ? AND pa.left_at IS NULL
                JOIN public.conversation_participants pb
                  ON pb.conversation_id = c.id AND pb.user_id = ? AND pb.left_at IS NULL
                WHERE c.type = 'DIRECT'
                  AND (SELECT count(*) FROM public.conversation_participants p
                       WHERE p.conversation_id = c.id AND p.left_at IS NULL) = 2
                ORDER BY c.created_at DESC LIMIT 1
                """, rs -> rs.next() ? (UUID) rs.getObject(1) : null, a, b);
    }
}

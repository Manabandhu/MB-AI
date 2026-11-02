package com.manabandhu.backend.referrals;

import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.ContactOwnerService;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.notifications.Notification;

/**
 * A member contacts the poster of an open referral: reuses their direct chat (or opens one), sends the message,
 * and notifies the poster, all in one transaction. Only open referrals, never your own.
 */
@Service
public class ReferralContactService {

    private final ReferralRepository referrals;
    private final ConversationParticipantService participantService;
    private final ContactOwnerService contacts;
    private final JdbcTemplate jdbcTemplate;

    ReferralContactService(ReferralRepository referrals, ConversationParticipantService participantService,
                           ContactOwnerService contacts, JdbcTemplate jdbcTemplate) {
        this.referrals = referrals;
        this.participantService = participantService;
        this.contacts = contacts;
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
            // Only an admin reaches here; answer like everyone else so the contract stays one rule.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Referral not found");
        }
        var text = message == null ? "" : message.trim();
        if (text.length() < 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Write at least 20 characters");
        }

        var contact = new ContactOwnerService.Contact(
                actor.id(), ownerId, Conversation.ConversationType.DIRECT, "Referral: " + referral.getTitle(),
                "About your referral \"" + referral.getTitle() + "\":\n\n" + text,
                Notification.NotificationType.REFERRAL, "New referral message",
                "Someone messaged you about \"" + referral.getTitle() + "\".");
        var conversationId = existingDirect(actor.id(), ownerId);
        if (conversationId == null) {
            return contacts.open(contact);
        }
        // Reuse the direct chat these two already share; rejoin either side that had left.
        participantService.add(conversationId, actor.id(), ConversationParticipant.ParticipantRole.MEMBER);
        participantService.add(conversationId, ownerId, ConversationParticipant.ParticipantRole.MEMBER);
        contacts.post(conversationId, contact);
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

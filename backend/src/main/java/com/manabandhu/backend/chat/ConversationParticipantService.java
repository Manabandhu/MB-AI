package com.manabandhu.backend.chat;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.admin.AdminAuditService;
import com.manabandhu.backend.auth.Actor;

/** Conversation membership. Only active participants (and admins) can read or write a conversation. */
@Service
public class ConversationParticipantService {

    private final ConversationParticipantRepository repository;
    private final AdminAuditService audit;

    ConversationParticipantService(ConversationParticipantRepository repository, AdminAuditService audit) {
        this.repository = repository;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<ConversationParticipant> findByConversation(UUID conversationId) {
        return repository.findByConversationIdAndLeftAtIsNull(conversationId);
    }

    @Transactional(readOnly = true)
    public List<ConversationParticipant> listFor(Actor actor, UUID conversationId) {
        requireParticipant(actor, conversationId);
        return repository.findByConversationIdAndLeftAtIsNull(conversationId);
    }

    @Transactional(readOnly = true)
    public boolean isParticipant(UUID conversationId, UUID userId) {
        return repository.findByConversationIdAndUserId(conversationId, userId)
                .map(p -> p.getLeftAt() == null)
                .orElse(false);
    }

    /**
     * Fails with 403 unless the caller is an active participant or an admin. An admin opening a conversation
     * they are not part of is recorded in {@code admin_audit_log} ({@code chat.admin_access}).
     */
    @Transactional(readOnly = true)
    public void requireParticipant(Actor actor, UUID conversationId) {
        if (isParticipant(conversationId, actor.id())) return;
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant in this conversation");
        }
        audit.record(actor.id().toString(), "chat.admin_access", "CONVERSATION", conversationId.toString());
    }

    /**
     * Fails with 403 unless the caller is an active participant. Stricter than {@link #requireParticipant}: read state
     * is personal, so admins who are not members have none to change.
     */
    @Transactional(readOnly = true)
    public void requireActiveParticipant(Actor actor, UUID conversationId) {
        if (!isParticipant(conversationId, actor.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a participant in this conversation");
        }
    }

    /** Only the conversation owner (or an admin) can invite people. */
    @Transactional
    public ConversationParticipant invite(Actor actor, UUID conversationId, UUID userId) {
        var owner = repository.findByConversationIdAndUserId(conversationId, actor.id())
                .filter(p -> p.getLeftAt() == null && p.getRole() == ConversationParticipant.ParticipantRole.OWNER);
        if (!actor.admin() && owner.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the conversation owner can add participants");
        }
        return add(conversationId, userId, ConversationParticipant.ParticipantRole.MEMBER);
    }

    /** Adds a participant, or re-activates one who left, so the unique (conversation, user) row is reused. */
    @Transactional
    public ConversationParticipant add(UUID conversationId, UUID userId, ConversationParticipant.ParticipantRole role) {
        var existing = repository.findByConversationIdAndUserId(conversationId, userId);
        if (existing.isPresent()) {
            existing.get().rejoin();
            return existing.get();
        }
        return repository.save(new ConversationParticipant(conversationId, userId, role));
    }

    @Transactional
    public void leave(UUID conversationId, UUID userId) {
        repository.findByConversationIdAndUserId(conversationId, userId).ifPresent(ConversationParticipant::leave);
    }
}

package com.manabandhu.backend.chat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class ConversationService {

    private final ConversationRepository repository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final ConversationParticipantService participantService;

    ConversationService(ConversationRepository repository,
                        ConversationParticipantRepository participantRepository,
                        MessageRepository messageRepository,
                        ConversationParticipantService participantService) {
        this.repository = repository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.participantService = participantService;
    }

    /**
     * The caller's active conversations, newest activity first, each with the latest message text and the caller's
     * {@code unreadCount} (one grouped query for all conversations).
     */
    @Transactional(readOnly = true)
    public List<Conversation> findByParticipant(UUID userId) {
        var participants = participantRepository.findByUserIdAndLeftAtIsNull(userId);
        if (participants.isEmpty()) {
            return List.of();
        }
        var ids = participants.stream().map(ConversationParticipant::getConversationId).toList();
        var list = repository.findByIdInOrderByLastMessageAtDesc(ids);
        var unread = messageRepository.countUnreadByConversation(userId).stream()
                .collect(Collectors.toMap(UnreadCount::conversationId, UnreadCount::count));
        for (var conv : list) {
            messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conv.getId())
                    .ifPresent(latest -> conv.setLastMessage(latest.getBody()));
            conv.setUnreadCount(Math.toIntExact(unread.getOrDefault(conv.getId(), 0L)));
        }
        return list;
    }

    /**
     * One conversation for a participant (or an audited admin), with the latest message text and the caller's
     * {@code unreadCount}. An admin who is not a member has no read state, so their {@code unreadCount} stays null.
     */
    @Transactional(readOnly = true)
    public Conversation findFor(Actor actor, UUID id) {
        participantService.requireParticipant(actor, id);
        var conversation = find(id);
        messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(id)
                .ifPresent(latest -> conversation.setLastMessage(latest.getBody()));
        if (participantService.isParticipant(id, actor.id())) {
            conversation.setUnreadCount(Math.toIntExact(messageRepository.countUnread(id, actor.id())));
        }
        return conversation;
    }

    /**
     * Marks the conversation read for the caller up to {@code messageId}'s time (404 if that message is not in this
     * conversation) or up to now. Only active participants have read state (403 otherwise, admins included). The marker
     * never moves backwards, so a late or out-of-order call cannot resurrect unread messages.
     */
    @Transactional
    public ReadState markRead(Actor actor, UUID id, UUID messageId) {
        participantService.requireActiveParticipant(actor, id);
        Instant readAt;
        if (messageId == null) {
            readAt = Instant.now();
        } else {
            readAt = messageRepository.findByIdAndConversationId(messageId, id)
                    .map(Message::getCreatedAt)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        }
        if (participantRepository.advanceLastReadAt(id, actor.id(), readAt) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not an active participant in this conversation");
        }
        var lastReadAt = participantRepository.findByConversationIdAndUserId(id, actor.id())
                .map(ConversationParticipant::getLastReadAt)
                .orElse(readAt);
        return new ReadState(id, lastReadAt, messageRepository.countUnread(id, actor.id()));
    }

    @Transactional(readOnly = true)
    public Conversation find(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }

    /** Conversations a user may start directly; inquiry and ride chats are created by their own flows. */
    @Transactional
    public Conversation createAs(Actor actor, Conversation.ConversationType type, String title) {
        if (type != Conversation.ConversationType.DIRECT && type != Conversation.ConversationType.GROUP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only DIRECT or GROUP conversations can be created");
        }
        return create(actor.id(), type, title);
    }

    @Transactional
    public Conversation create(UUID ownerId, Conversation.ConversationType type, String title) {
        var conversation = repository.save(new Conversation(type, title));
        participantRepository.save(new ConversationParticipant(conversation.getId(), ownerId, ConversationParticipant.ParticipantRole.OWNER));
        return conversation;
    }

    @Transactional
    public void updateLastMessageAt(UUID conversationId, Instant at) {
        repository.findById(conversationId).ifPresent(c -> c.updateLastMessageAt(at));
    }
}

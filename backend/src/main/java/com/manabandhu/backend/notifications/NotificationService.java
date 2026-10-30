package com.manabandhu.backend.notifications;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class NotificationService {

    private final NotificationRepository repository;

    NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    static final int MAX_PAGE_SIZE = 50;

    /** One page of the caller's inbox, newest first; the page size is capped at {@link #MAX_PAGE_SIZE}. */
    @Transactional(readOnly = true)
    public Page<Notification> page(Actor actor, int page, int size) {
        var bounded = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(size, MAX_PAGE_SIZE)));
        return repository.findByUserIdOrderByCreatedAtDesc(actor.id(), bounded);
    }

    /** Reading a notification never changes it; use {@link #markRead}. */
    @Transactional(readOnly = true)
    public Notification requireOwn(Actor actor, UUID id) {
        var notification = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        actor.requireOwner(notification.getUserId(), "Not your notification");
        return notification;
    }

    @Transactional
    public int markAllRead(Actor actor) {
        return repository.markAllRead(actor.id(), java.time.Instant.now());
    }

    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public Notification create(UUID userId, String title, String body, Notification.NotificationType type, String actionRoute) {
        return repository.save(new Notification(userId, title, body, type, actionRoute));
    }

    @Transactional
    public Notification markRead(Actor actor, UUID id) {
        var notification = requireOwn(actor, id);
        if (!notification.isRead()) notification.markRead();
        return notification;
    }

    /** Must run inside a transaction: the claimed rows stay locked until it commits. */
    /** After this many failed pushes a notification stays in the inbox but is no longer pushed. */
    static final int MAX_DISPATCH_ATTEMPTS = 5;

    @Transactional
    public List<Notification> claimPending(int limit) {
        return repository.claimUndispatched(limit, MAX_DISPATCH_ATTEMPTS);
    }

    @Transactional
    public Notification save(Notification notification) {
        return repository.save(notification);
    }
}

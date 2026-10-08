package com.manabandhu.backend.notifications;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
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

    @Transactional(readOnly = true)
    public List<Notification> findByUser(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
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
        var notification = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        actor.requireOwner(notification.getUserId(), "Not your notification");
        notification.markRead();
        return notification;
    }

    /** Must run inside a transaction: the claimed rows stay locked until it commits. */
    @Transactional
    public List<Notification> claimPending(int limit) {
        return repository.claimUndispatched(limit);
    }

    @Transactional
    public Notification save(Notification notification) {
        return repository.save(notification);
    }
}

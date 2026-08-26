package com.manabandhu.backend.notifications;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Notification markRead(UUID id) {
        var notification = repository.findById(id).orElseThrow();
        notification.markRead();
        return notification;
    }
}

package com.manabandhu.backend.notifications;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsApiController {

    private final NotificationService notificationService;
    private final NotificationPreferenceService preferenceService;

    NotificationsApiController(NotificationService notificationService, NotificationPreferenceService preferenceService) {
        this.notificationService = notificationService;
        this.preferenceService = preferenceService;
    }

    @GetMapping
    List<Notification> notifications(Authentication authentication) {
        return notificationService.findByUser(Actor.require(authentication).id());
    }

    @GetMapping("/unread-count")
    long unreadCount(Authentication authentication) {
        return notificationService.countUnread(Actor.require(authentication).id());
    }

    @PostMapping
    ResponseEntity<Notification> create(Authentication authentication, @Valid @RequestBody CreateNotificationRequest request) {
        // Notifications are produced by the system; only admins may create them by hand (for example to test push).
        Actor.require(authentication).requireAdmin();
        var type = Notification.NotificationType.valueOf(request.type());
        var notification = notificationService.create(Actor.require(authentication).id(), request.title(), request.body(), type, request.actionRoute());
        return ResponseEntity.created(URI.create("/api/v1/notifications/" + notification.getId())).body(notification);
    }

    @PostMapping("/{id}/read")
    ResponseEntity<Notification> markRead(Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markRead(Actor.require(authentication), id));
    }

    @GetMapping("/preferences")
    List<NotificationPreference> preferences(Authentication authentication) {
        return preferenceService.findByUser(Actor.require(authentication).id());
    }

    @PostMapping("/preferences")
    ResponseEntity<NotificationPreference> setPreference(Authentication authentication, @Valid @RequestBody SetPreferenceRequest request) {
        var channel = NotificationPreference.Channel.valueOf(request.channel());
        var pref = preferenceService.set(Actor.require(authentication).id(), channel, request.enabled());
        return ResponseEntity.ok(pref);
    }
}

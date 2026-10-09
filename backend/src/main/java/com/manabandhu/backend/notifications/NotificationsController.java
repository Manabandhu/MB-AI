package com.manabandhu.backend.notifications;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsController {

    private final NotificationsContentService service;
    private final NotificationService notificationService;

    NotificationsController(NotificationsContentService service, NotificationService notificationService) {
        this.service = service;
        this.notificationService = notificationService;
    }

    /** The caller's own notifications, newest first (capped at 100). */
    @GetMapping("/inbox")
    NotificationInbox inbox(Authentication authentication) {
        var items = notificationService.findByUser(Actor.require(authentication).id()).stream()
                .limit(100)
                .map(NotificationDetail::of)
                .toList();
        return new NotificationInbox(items);
    }

    /** Opening a notification marks it read. Only the recipient can open it. */
    @GetMapping("/{id}")
    NotificationDetail detail(Authentication authentication, @PathVariable UUID id) {
        return NotificationDetail.of(notificationService.markRead(Actor.require(authentication), id));
    }

    @GetMapping("/settings")
    ResponseEntity<NotificationSettings> settings(Authentication authentication) {
        return ResponseEntity.ok(service.settings(Actor.require(authentication).id()));
    }

    @PatchMapping("/settings")
    ResponseEntity<NotificationSettings> updateSettings(Authentication authentication, @RequestBody NotificationSettings update) {
        return ResponseEntity.ok(service.updateSettings(Actor.require(authentication).id(), update));
    }
}
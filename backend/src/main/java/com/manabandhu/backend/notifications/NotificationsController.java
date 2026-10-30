package com.manabandhu.backend.notifications;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    /** One page of the caller's notifications, newest first (size capped at 50). */
    @GetMapping("/inbox")
    NotificationInbox inbox(Authentication authentication,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "20") int size) {
        var actor = Actor.require(authentication);
        var result = notificationService.page(actor, page, size);
        return new NotificationInbox(result.getContent().stream().map(NotificationDetail::of).toList(),
                result.getNumber(), result.hasNext(), notificationService.countUnread(actor.id()));
    }

    /** Only the recipient can open a notification; opening it does not mark it read (use POST /{id}/read). */
    @GetMapping("/{id}")
    NotificationDetail detail(Authentication authentication, @PathVariable UUID id) {
        return NotificationDetail.of(notificationService.requireOwn(Actor.require(authentication), id));
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
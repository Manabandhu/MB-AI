package com.manabandhu.backend.notifications;

import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.manabandhu.backend.auth.Actor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsController {

    private final NotificationsContentService service;

    NotificationsController(NotificationsContentService service) {
        this.service = service;
    }

    @GetMapping("/inbox")
    CatalogScreenContent inbox() {
        return service.inbox();
    }

    @GetMapping("/{id}")
    ResponseEntity<NotificationDetail> detail(@PathVariable String id) {
        var item = service.detail(id);
        return ResponseEntity.ok(item);
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
package com.manabandhu.backend.notifications;

import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.http.ResponseEntity;
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
    ResponseEntity<NotificationSettings> settings() {
        return ResponseEntity.ok(service.settings());
    }
}